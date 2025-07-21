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
