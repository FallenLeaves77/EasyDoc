import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { EasyDocService } from '../services/EasyDocService';

const router = Router();

// 导入真实上传文档的存储数组
import { uploadedDocuments } from './documents';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

    // 确保文件名使用UTF-8编码
    let originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');

    console.log(`📝 Processing filename: ${originalName}`);

    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);

    // 保留中文字符，只替换文件系统不支持的特殊字符
    // 移除或替换可能导致文件系统问题的字符：< > : " | ? * \ /
    const sanitizedName = name.replace(/[<>:"|?*\\/]/g, '_');

    cb(null, `${sanitizedName}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);

    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExt} is not allowed`));
    }
  },
});

/**
 * Upload a document
 * POST /api/upload
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE_UPLOADED',
          message: 'No file uploaded',
        },
      });
    }

    console.log('📁 File uploaded:', {
      originalName: req.file.originalname,
      fileName: req.file.filename,
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    // Create document record
    const documentId = Date.now().toString();
    // 确保原始文件名使用正确的UTF-8编码
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    const document = {
      _id: documentId,
      fileName: req.file.filename,
      originalName: originalName,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      status: 'parsing',
      contentBlocks: [] as any[],
      structureNodes: [] as any[],
      tables: [] as any[],
      figures: [] as any[],
    };

    // 添加到真实文档列表
    uploadedDocuments.push(document);

    // 立即返回响应，然后在后台进行解析
    const response = {
      success: true,
      data: {
        document,
        message: 'File uploaded successfully, parsing started',
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: documentId,
        version: '1.0.0',
      },
    };

    res.status(201).json(response);

    // 在后台异步解析文档
    setImmediate(() => parseDocumentAsync(req.file.path, documentId));
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || 'Upload failed',
      },
    });
  }
});

/**
 * 异步解析文档
 */
async function parseDocumentAsync(filePath: string, documentId: string) {
  try {
    console.log(`🔄 Starting document parsing for ID: ${documentId}`);

    // 检查环境变量
    if (!process.env.EASYDOC_API_KEY) {
      console.log('⚠️ EASYDOC_API_KEY not configured, reading file content directly');
      // 直接读取文件内容作为纯文本
      await updateDocumentWithLocalFileContent(documentId, filePath).catch(console.error);
      return;
    }

    // 初始化EasyDoc服务
    const easyDocService = new EasyDocService();

    // 调用EasyDoc API解析文档，使用pro模式以获得更好的图片和表格识别
    const parseResult = await easyDocService.parseDocument(filePath, {
      mode: 'pro', // 使用pro模式，获得更好的图片和表格识别
    });

    if (parseResult.success && (parseResult.data?.task_id || parseResult.data?.taskId)) {
      console.log('✅ Document parsing task created, polling for result...');

      // 轮询获取解析结果
      const taskId = parseResult.data.task_id || parseResult.data.taskId;
      const finalResult = await easyDocService.pollParseResult(taskId!);

      if (finalResult.success && finalResult.data?.task_result) {
        console.log('✅ Document parsed successfully');
        updateDocumentWithParseResult(documentId, finalResult.data.task_result);
      } else {
        console.error('❌ Document parsing polling failed:', finalResult.errMessage);

        // 轮询失败时读取本地文件内容作为fallback
        console.log('🔄 Falling back to local file content');
        await updateDocumentWithLocalFileContent(documentId, filePath).catch(console.error);
      }
    } else {
      console.error('❌ Document parsing failed:', parseResult.errMessage);

      // API失败时读取本地文件内容作为fallback
      console.log('🔄 Falling back to local file content');
      await updateDocumentWithLocalFileContent(documentId, filePath).catch(console.error);
    }
  } catch (error: any) {
    console.error('❌ Error in parseDocumentAsync:', error);

    // API错误时读取本地文件内容作为fallback
    console.log('🔄 Falling back to local file content due to API error');
    await updateDocumentWithLocalFileContent(documentId, filePath).catch(console.error);
  }
}

/**
 * 更新文档解析结果
 */
function updateDocumentWithParseResult(documentId: string, parseData: any) {
  const document = uploadedDocuments.find(doc => doc._id === documentId);
  if (!document) return;

  // 调试：打印实际返回的数据结构
  console.log('🔍 EasyDoc API returned data structure:', JSON.stringify(parseData, null, 2));

  // 转换EasyDoc API结果为我们的格式
  document.status = 'completed';

  // 处理内容块
  document.contentBlocks = transformContentBlocks(parseData, documentId);

  // 处理结构节点
  document.structureNodes = transformStructureNodes(parseData, documentId);

  // 处理表格数据
  document.tables = transformTables(parseData, documentId);

  // 处理图形数据
  document.figures = transformFigures(parseData, documentId);

  console.log(`✅ Document ${documentId} updated with parse results:
    - Content blocks: ${document.contentBlocks.length}
    - Structure nodes: ${document.structureNodes.length}
    - Tables: ${document.tables.length}
    - Figures: ${document.figures.length}`);
}

/**
 * 使用示例数据更新文档（当API不可用时）
 */
function updateDocumentWithSampleData(documentId: string) {
  const document = uploadedDocuments.find(doc => doc._id === documentId);
  if (!document) return;

  document.status = 'completed';
  document.contentBlocks = [
    {
      id: `block_${documentId}_1`,
      type: 'title',
      content: `${document.originalName} - 标题`,
      position: { page: 1, x: 0, y: 0, width: 100, height: 20 },
      metadata: { confidence: 0.95, wordCount: 3 },
    },
    {
      id: `block_${documentId}_2`,
      type: 'paragraph',
      content: `这是 ${document.originalName} 的示例内容。请配置 EASYDOC_API_KEY 环境变量以获取真实的文档解析结果。`,
      position: { page: 1, x: 0, y: 30, width: 100, height: 40 },
      metadata: { confidence: 0.90, wordCount: 20 },
    },
  ];
  document.structureNodes = [
    {
      id: `node_${documentId}_1`,
      type: 'document',
      title: document.originalName,
      level: 0,
      position: { page: 1, order: 0 },
      childIds: [],
      contentBlockIds: [`block_${documentId}_1`, `block_${documentId}_2`],
      metadata: { wordCount: 100, importance: 1.0, keywords: ['document'] },
    },
  ];

  console.log(`✅ Document ${documentId} updated with sample data`);
}

/**
 * 更新文档状态
 */
function updateDocumentStatus(documentId: string, status: string, errorMessage?: string) {
  const document = uploadedDocuments.find(doc => doc._id === documentId);
  if (!document) return;

  document.status = status;
  if (errorMessage) {
    document.errorMessage = errorMessage;
  }

  console.log(`📝 Document ${documentId} status updated to: ${status}`);
}

/**
 * 转换内容块数据 - 确保所有文档都能显示纯文本内容
 */
function transformContentBlocks(parseData: any, documentId: string): any[] {
  const blocks: any[] = [];

  console.log('🔍 Transforming content blocks from parseData:', JSON.stringify(parseData, null, 2));

  // 优先处理结构化的内容块
  if (parseData.content_blocks || parseData.contentBlocks) {
    const contentBlocks = parseData.content_blocks || parseData.contentBlocks;
    contentBlocks.forEach((block: any, index: number) => {
      const content = block.content || block.text || block.value || '';
      if (content.trim()) {
        blocks.push({
          id: block.id || `block_${documentId}_${index + 1}`,
          type: 'paragraph', // 统一使用paragraph类型，确保显示一致性
          content: content.trim(),
          position: {
            page: block.page || block.position?.page || 1,
            x: block.x || block.position?.x || 0,
            y: block.y || block.position?.y || index * 30,
            width: block.width || block.position?.width || 100,
            height: block.height || block.position?.height || 20
          },
          metadata: {
            confidence: block.confidence || 0.9,
            language: block.language || 'zh-CN',
            semanticTags: block.semantic_tags || block.semanticTags || [],
            wordCount: content.length
          }
        });
      }
    });
  }

  // 处理纯文本内容（如果没有结构化内容块或作为补充）
  if (parseData.text || parseData.content) {
    const text = parseData.text || parseData.content;
    if (typeof text === 'string' && text.trim()) {
      // 按行分割文本，保持原始格式
      const lines = text.split('\n').filter((line: string) => line.trim().length > 0);

      lines.forEach((line: string, index: number) => {
        blocks.push({
          id: `text_line_${documentId}_${index + 1}`,
          type: 'paragraph',
          content: line.trim(),
          position: {
            page: 1,
            x: 0,
            y: index * 25,
            width: 100,
            height: 20
          },
          metadata: {
            confidence: 0.95,
            language: 'zh-CN',
            semanticTags: [],
            wordCount: line.length
          }
        });
      });
    }
  }

  // 处理其他可能的文本字段
  if (blocks.length === 0) {
    // 尝试从其他字段提取文本
    const possibleTextFields = ['markdown', 'html', 'plain_text', 'extracted_text', 'ocr_text'];
    for (const field of possibleTextFields) {
      if (parseData[field] && typeof parseData[field] === 'string') {
        const text = parseData[field].trim();
        if (text) {
          const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
          lines.forEach((line: string, index: number) => {
            blocks.push({
              id: `extracted_${documentId}_${index + 1}`,
              type: 'paragraph',
              content: line.trim(),
              position: {
                page: 1,
                x: 0,
                y: index * 25,
                width: 100,
                height: 20
              },
              metadata: {
                confidence: 0.8,
                language: 'zh-CN',
                semanticTags: [],
                wordCount: line.length
              }
            });
          });
          break; // 找到第一个有效字段就停止
        }
      }
    }
  }

  console.log(`✅ Transformed ${blocks.length} content blocks for document ${documentId}`);
  return blocks;
}

/**
 * 转换结构节点数据
 */
function transformStructureNodes(parseData: any, documentId: string): any[] {
  const nodes: any[] = [];

  if (parseData.structure_nodes || parseData.structureNodes) {
    const structureNodes = parseData.structure_nodes || parseData.structureNodes;
    structureNodes.forEach((node: any, index: number) => {
      nodes.push({
        id: node.id || `node_${documentId}_${index + 1}`,
        type: node.type || 'section',
        title: node.title || node.text || `节点 ${index + 1}`,
        level: node.level || 1,
        position: {
          page: node.page || 1,
          order: node.order || index + 1
        },
        parentId: node.parent_id || node.parentId,
        childIds: node.child_ids || node.childIds || [],
        contentBlockIds: node.content_block_ids || node.contentBlockIds || [],
        metadata: {
          wordCount: node.word_count || node.wordCount || 0,
          importance: node.importance || 1.0,
          keywords: node.keywords || []
        }
      });
    });
  }

  return nodes;
}

/**
 * 转换表格数据
 */
function transformTables(parseData: any, documentId: string): any[] {
  const tables: any[] = [];

  if (parseData.tables) {
    parseData.tables.forEach((table: any, index: number) => {
      // 处理表格数据
      const tableData: any[][] = [];

      if (table.data && Array.isArray(table.data)) {
        table.data.forEach((row: any) => {
          if (Array.isArray(row)) {
            const rowData = row.map((cell: any) => ({
              value: typeof cell === 'string' ? cell : (cell?.value || cell?.text || String(cell || '')),
              type: detectCellType(cell),
              colspan: cell?.colspan || 1,
              rowspan: cell?.rowspan || 1,
              isHeader: cell?.isHeader || false
            }));
            tableData.push(rowData);
          }
        });
      } else if (table.rows && Array.isArray(table.rows)) {
        // 处理另一种表格格式
        table.rows.forEach((row: any) => {
          if (row.cells && Array.isArray(row.cells)) {
            const rowData = row.cells.map((cell: any) => ({
              value: cell.text || cell.content || String(cell || ''),
              type: detectCellType(cell.text || cell.content),
              colspan: cell.colspan || 1,
              rowspan: cell.rowspan || 1,
              isHeader: row.isHeader || cell.isHeader || false
            }));
            tableData.push(rowData);
          }
        });
      }

      tables.push({
        id: table.id || `table_${documentId}_${index + 1}`,
        position: {
          page: table.page || table.position?.page || 1,
          x: table.x || table.position?.x || 0,
          y: table.y || table.position?.y || 0,
          width: table.width || table.position?.width || 100,
          height: table.height || table.position?.height || 50
        },
        structure: {
          rows: table.rows_count || table.structure?.rows || tableData.length,
          columns: table.columns_count || table.structure?.columns || (tableData[0]?.length || 0),
          hasHeader: table.has_header || table.structure?.hasHeader || false,
          hasFooter: table.has_footer || table.structure?.hasFooter || false
        },
        data: tableData,
        metadata: {
          title: table.title || table.caption,
          caption: table.caption || table.description,
          confidence: table.confidence || 0.9,
          dataTypes: detectTableDataTypes(tableData)
        }
      });
    });
  }

  return tables;
}

/**
 * 转换图形数据
 */
function transformFigures(parseData: any, documentId: string): any[] {
  const figures: any[] = [];

  if (parseData.figures || parseData.images) {
    const figureData = parseData.figures || parseData.images;
    figureData.forEach((figure: any, index: number) => {
      figures.push({
        id: figure.id || `figure_${documentId}_${index + 1}`,
        type: classifyFigureType(figure),
        position: {
          page: figure.page || figure.position?.page || 1,
          x: figure.x || figure.position?.x || 0,
          y: figure.y || figure.position?.y || 0,
          width: figure.width || figure.position?.width || 100,
          height: figure.height || figure.position?.height || 100
        },
        content: {
          imageUrl: figure.image_url || figure.imageUrl || figure.url,
          description: figure.description || figure.alt_text || figure.caption || '图形内容',
          caption: figure.caption || figure.title,
          altText: figure.alt_text || figure.altText || figure.description
        },
        metadata: {
          confidence: figure.confidence || 0.9,
          extractedText: figure.extracted_text || figure.text || figure.ocr_text,
          colors: figure.colors || [],
          objects: figure.objects || figure.detected_objects || [],
          fileType: figure.file_type || figure.format || 'image',
          size: figure.size || figure.file_size,
          isReference: figure.is_reference || false
        }
      });
    });
  }

  return figures;
}

/**
 * 检测单元格数据类型
 */
function detectCellType(value: any): 'text' | 'number' | 'date' | 'boolean' | 'empty' {
  if (!value || value === '') return 'empty';

  const str = String(value).trim();

  if (str === '' || str === '-' || str === 'N/A') return 'empty';
  if (str === 'true' || str === 'false' || str === '是' || str === '否') return 'boolean';
  if (!isNaN(Number(str)) && !isNaN(parseFloat(str))) return 'number';
  if (isValidDate(str)) return 'date';

  return 'text';
}

/**
 * 检测表格数据类型
 */
function detectTableDataTypes(tableData: any[][]): string[] {
  if (!tableData || tableData.length === 0) return [];

  const columnCount = tableData[0]?.length || 0;
  const dataTypes: string[] = [];

  for (let col = 0; col < columnCount; col++) {
    const columnValues = tableData.map(row => row[col]?.value).filter(v => v && v !== '');

    if (columnValues.length === 0) {
      dataTypes.push('empty');
      continue;
    }

    const types = columnValues.map(v => detectCellType(v));
    const typeCount = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 选择最常见的类型
    const dominantType = Object.entries(typeCount).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    dataTypes.push(dominantType);
  }

  return dataTypes;
}

/**
 * 分类图形类型
 */
function classifyFigureType(figure: any): string {
  const description = (figure.description || figure.alt_text || figure.caption || '').toLowerCase();
  const filename = (figure.filename || figure.name || '').toLowerCase();

  if (description.includes('chart') || description.includes('图表') || filename.includes('chart')) return 'chart';
  if (description.includes('graph') || description.includes('图形') || filename.includes('graph')) return 'graph';
  if (description.includes('diagram') || description.includes('示意图') || filename.includes('diagram')) return 'diagram';
  if (description.includes('photo') || description.includes('照片') || filename.includes('photo')) return 'photo';
  if (description.includes('illustration') || description.includes('插图') || filename.includes('illustration')) return 'illustration';

  return 'image';
}

/**
 * 验证日期格式
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.length > 6;
}

/**
 * 读取本地文件内容并更新文档
 */
async function updateDocumentWithLocalFileContent(documentId: string, filePath: string) {
  const document = uploadedDocuments.find(doc => doc._id === documentId);
  if (!document) {
    console.error(`Document ${documentId} not found`);
    return;
  }

  try {
    console.log(`📖 Reading local file content: ${filePath}`);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // 获取文件扩展名
    const fileExt = path.extname(filePath).toLowerCase();
    let textContent = '';

    if (fileExt === '.txt') {
      // 直接读取TXT文件
      textContent = fs.readFileSync(filePath, 'utf8');
    } else if (fileExt === '.doc' || fileExt === '.docx') {
      // 尝试使用textract提取DOC/DOCX文件内容
      try {
        console.log(`📄 Attempting to extract text from ${fileExt.toUpperCase()} file using textract...`);
        const textract = require('textract');

        // 使用Promise包装textract
        textContent = await new Promise<string>((resolve, reject) => {
          textract.fromFileWithPath(filePath, (error: any, text: string) => {
            if (error) {
              reject(error);
            } else {
              resolve(text || '');
            }
          });
        });

        if (textContent.trim().length === 0) {
          throw new Error('No text content extracted');
        }

        console.log(`✅ Successfully extracted ${textContent.length} characters from ${fileExt.toUpperCase()} file`);

      } catch (extractError: any) {
        console.log(`❌ Failed to extract text from ${fileExt.toUpperCase()} file:`, extractError.message);

        // 如果提取失败，提供详细的提示信息
        textContent = `此文档为 ${fileExt.toUpperCase()} 格式。

由于EasyDoc API暂时不可用且本地文本提取失败，无法显示此文档的完整内容。

文档信息：
- 文件名：${document.originalName}
- 文件大小：${(document.fileSize / 1024).toFixed(2)} KB
- 上传时间：${new Date(document.uploadedAt).toLocaleString('zh-CN')}

提取失败原因：${extractError.message}

建议解决方案：
1. 等待EasyDoc API服务恢复正常后重新处理
2. 将文档转换为DOCX格式后重新上传
3. 将文档内容复制到TXT文件中上传
4. 检查文档是否损坏或格式异常

注意：老版本的DOC文件可能需要专门的处理工具才能正确解析。`;
      }
    } else if (fileExt === '.pdf') {
      // 对于PDF文件，提供提示信息
      textContent = `此文档为 PDF 格式。

由于EasyDoc API暂时不可用，无法解析此PDF文档的内容。

文档信息：
- 文件名：${document.originalName}
- 文件大小：${(document.fileSize / 1024).toFixed(2)} KB
- 上传时间：${new Date(document.uploadedAt).toLocaleString('zh-CN')}

PDF文档需要专业的解析服务才能提取文本内容。请确保EasyDoc API服务正常后重新处理。`;
    } else {
      // 其他格式
      textContent = `此文档为 ${fileExt.toUpperCase()} 格式。

由于EasyDoc API暂时不可用，无法解析此文档格式的内容。

文档信息：
- 文件名：${document.originalName}
- 文件大小：${(document.fileSize / 1024).toFixed(2)} KB
- 上传时间：${new Date(document.uploadedAt).toLocaleString('zh-CN')}

支持的格式：PDF、DOC、DOCX、TXT、RTF
当前只能直接读取TXT格式的文件内容。`;
    }

    // 将文本内容转换为内容块
    const lines = textContent.split('\n').filter(line => line.trim().length > 0);
    const contentBlocks = lines.map((line, index) => ({
      id: `local_block_${documentId}_${index + 1}`,
      type: 'paragraph',
      content: line.trim(),
      position: {
        page: 1,
        x: 0,
        y: index * 25,
        width: 100,
        height: 20
      },
      metadata: {
        confidence: 1.0,
        language: 'zh-CN',
        semanticTags: [] as string[],
        wordCount: line.length,
        source: 'local_file'
      }
    }));

    // 更新文档
    document.status = 'completed';
    document.contentBlocks = contentBlocks;
    document.structureNodes = [{
      id: `local_node_${documentId}_1`,
      type: 'document',
      title: document.originalName,
      level: 0,
      position: { page: 1, order: 0 },
      childIds: [],
      contentBlockIds: contentBlocks.map(block => block.id),
      metadata: {
        wordCount: textContent.length,
        importance: 1.0,
        keywords: [] as string[],
        source: 'local_file'
      }
    }];
    document.tables = [];
    document.figures = [];

    console.log(`✅ Document ${documentId} updated with local file content (${contentBlocks.length} blocks)`);

  } catch (error: any) {
    console.error(`❌ Error reading local file content:`, error);

    // 设置错误状态
    document.status = 'failed';
    document.parseResult = {
      success: false,
      errCode: 'LOCAL_READ_ERROR',
      errMessage: `无法读取文件内容：${error.message}`
    };
  }
}

export default router;
