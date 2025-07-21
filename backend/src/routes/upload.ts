import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { EasyDocService } from '../services/EasyDocService';

const router = Router();

// 导入真实上传文档的存储数组
import { uploadedDocuments } from './documents';
import { updateDocumentWithIntelligentSampleData } from './parse';

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

    // 处理文件名编码问题
    let originalName = file.originalname;

    // 尝试修复编码问题
    try {
      // 检测并修复常见的编码问题
      const buffer = Buffer.from(originalName, 'latin1');
      const utf8Name = buffer.toString('utf8');

      // 如果转换后的名称看起来更合理（包含中文字符），则使用转换后的名称
      if (/[\u4e00-\u9fa5]/.test(utf8Name)) {
        originalName = utf8Name;
        console.log('📝 Fixed filename encoding:', originalName);
      }
    } catch (error) {
      console.log('⚠️ Failed to fix filename encoding, using original:', originalName);
    }

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
    const document = {
      _id: documentId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
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
      console.log('⚠️ EASYDOC_API_KEY not configured, using intelligent sample data');
      // 使用智能示例数据更新文档（基于文件内容）
      await updateDocumentWithIntelligentSampleData(documentId, filePath).catch(console.error);
      return;
    }

    // 初始化EasyDoc服务
    const easyDocService = new EasyDocService();

    // 调用EasyDoc API解析文档
    const parseResult = await easyDocService.parseDocument(filePath, {
      mode: 'lite', // 使用lite模式，速度更快
    });

    if (parseResult.success && parseResult.data) {
      console.log('✅ Document parsed successfully');
      updateDocumentWithParseResult(documentId, parseResult.data);
    } else {
      console.error('❌ Document parsing failed:', parseResult.errMessage);

      // API失败时使用智能示例数据作为fallback
      console.log('🔄 Falling back to intelligent sample data');
      await updateDocumentWithIntelligentSampleData(documentId, filePath).catch(console.error);
    }
  } catch (error: any) {
    console.error('❌ Error in parseDocumentAsync:', error);

    // API错误时使用智能示例数据作为fallback
    console.log('🔄 Falling back to intelligent sample data due to API error');
    await updateDocumentWithIntelligentSampleData(documentId, filePath).catch(console.error);
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
  document.contentBlocks = parseData.content_blocks || parseData.contentBlocks || [];
  document.structureNodes = parseData.structure_nodes || parseData.structureNodes || [];
  document.tables = parseData.tables || [];
  document.figures = parseData.figures || [];

  console.log(`✅ Document ${documentId} updated with parse results (${document.contentBlocks.length} blocks, ${document.structureNodes.length} nodes)`);
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

export default router;
