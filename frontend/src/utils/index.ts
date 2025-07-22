import { DocumentStatus, ContentBlockType } from '../types';

// 状态显示名称映射
export const getStatusDisplayName = (status: DocumentStatus): string => {
  const statusNames = {
    [DocumentStatus.UPLOADED]: '已上传',
    [DocumentStatus.PARSING]: '处理中',
    [DocumentStatus.COMPLETED]: '已完成',
    [DocumentStatus.FAILED]: '失败',
  };
  return statusNames[status] || status;
};

// 内容块类型显示名称映射
export const getContentBlockTypeDisplayName = (type: ContentBlockType): string => {
  const typeNames = {
    [ContentBlockType.TITLE]: '标题',
    [ContentBlockType.HEADING]: '标题',
    [ContentBlockType.PARAGRAPH]: '段落',
    [ContentBlockType.LIST]: '列表',
    [ContentBlockType.QUOTE]: '引用',
    [ContentBlockType.CODE]: '代码',
    [ContentBlockType.TABLE]: '表格',
    [ContentBlockType.FIGURE]: '图形',
    [ContentBlockType.CAPTION]: '标题',
    [ContentBlockType.FOOTER]: '页脚',
    [ContentBlockType.HEADER]: '页眉',
  };
  return typeNames[type] || type;
};

// 文件大小格式化
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 字节';
  const k = 1024;
  const sizes = ['字节', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 日期格式化
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 处理状态的中文映射
export const getProcessingStatusDisplayName = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'PENDING': '等待中',
    'PROGRESSING': '处理中',
    'SUCCESS': '成功',
    'ERROR': '错误',
    'uploaded': '已上传',
    'parsing': '处理中',
    'completed': '已完成',
    'failed': '失败'
  };
  return statusMap[status] || status;
};

// 处理文件名显示，解决编码问题
export const safeDisplayFileName = (fileName: string): string => {
  if (!fileName || typeof fileName !== 'string') {
    return '未知文件';
  }

  let cleanName = fileName.trim();

  // 检测常见的文件名乱码模式
  const garbledPatterns = [
    /[锘縚]/g, // UTF-8 BOM 乱码
    /[\u00C0-\u00FF]{3,}/g, // 连续的扩展ASCII字符
    /[Ã¤Â¸Â­Ã¦Â–Â‡]/g, // UTF-8双重编码乱码
    /[ä¸­æ–‡]/g, // 另一种常见的UTF-8乱码
    /[涓枃]/g, // GBK编码显示为UTF-8的乱码
  ];

  // 检查是否包含乱码
  let hasGarbledContent = false;
  for (const pattern of garbledPatterns) {
    if (pattern.test(cleanName)) {
      hasGarbledContent = true;
      break;
    }
  }

  // 如果包含大量乱码字符，返回友好的文件名
  const garbledRatio = (cleanName.match(/[�\uFFFD\uFEFF]/g) || []).length / cleanName.length;
  if (garbledRatio > 0.1 || hasGarbledContent) {
    // 尝试提取文件扩展名
    const extensionMatch = cleanName.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch ? extensionMatch[0] : '';

    // 根据时间戳生成友好的文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    return `文档_${timestamp}${extension}`;
  }

  // 移除控制字符但保留正常的文件名字符
  cleanName = cleanName.replace(/[\x00-\x1F\x7F]/g, '');

  // 规范化Unicode字符
  cleanName = cleanName.normalize('NFC');

  return cleanName || '未知文件';
};

// 处理文本内容，清理编码问题
export const processTextContent = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let cleanText = text.trim();

  // 处理可能的编码问题
  try {
    // 检测并处理常见的乱码模式
    if (cleanText.includes('�') || /[\uFFFD\uFEFF]/.test(cleanText)) {
      console.warn('Detected potential encoding issues in text:', cleanText.substring(0, 50));

      // 如果整个文本都是乱码，返回提示
      const garbledRatio = (cleanText.match(/[�\uFFFD]/g) || []).length / cleanText.length;
      if (garbledRatio > 0.1) {
        return '[文档编码异常，请重新上传或检查文档格式]';
      }
    }

    // 检测更多常见乱码模式
    const commonGarbledPatterns = [
      /[锘縚]/g, // UTF-8 BOM 乱码
      /[\u00C0-\u00FF]{3,}/g, // 连续的扩展ASCII字符
      /[鐪嬩笉鎳俒]/g, // 常见的GBK->UTF8乱码
      /[Ã¤Â¸Â­Ã¦Â–Â‡]/g, // UTF-8双重编码乱码
      /[ä¸­æ–‡]/g, // 另一种常见的UTF-8乱码
      /[涓枃]/g, // GBK编码显示为UTF-8的乱码
    ];

    let hasGarbledContent = false;
    for (const pattern of commonGarbledPatterns) {
      if (pattern.test(cleanText)) {
        hasGarbledContent = true;
        break;
      }
    }

    if (hasGarbledContent) {
      // 尝试基本的乱码修复
      cleanText = cleanText
        .replace(/锘�/g, '') // 移除UTF-8 BOM乱码
        .replace(/[\u00C0-\u00FF]{3,}/g, '[编码异常]') // 替换明显的乱码段
        .replace(/[Ã¤Â¸Â­Ã¦Â–Â‡]/g, '中文') // 修复常见的UTF-8双重编码
        .replace(/[ä¸­æ–‡]/g, '中文') // 修复另一种UTF-8乱码
        .replace(/[涓枃]/g, '中文'); // 修复GBK乱码
    }

    // 确保文本是有效的UTF-8并规范化
    cleanText = cleanText.normalize('NFC');

    // 移除控制字符但保留换行符和制表符
    cleanText = cleanText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return cleanText;
  } catch (error) {
    console.error('Error processing text content:', error);
    return '[文本处理错误，请检查文档格式]';
  }
};
