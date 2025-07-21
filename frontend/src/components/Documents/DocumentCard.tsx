import React from 'react';
import Link from 'next/link';
import {
  DocumentIcon,
  EyeIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { format } from 'date-fns';

import { IDocument, DocumentStatus } from '../../types';
import { getStatusDisplayName, formatFileSize, formatDate } from '../../utils';

interface DocumentCardProps {
  document: IDocument;
  onDelete?: (document: IDocument) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.UPLOADED:
        return <CloudArrowUpIcon className="h-4 w-4" />;
      case DocumentStatus.PARSING:
        return <ClockIcon className="h-4 w-4 animate-spin" />;
      case DocumentStatus.COMPLETED:
        return <CheckCircleIcon className="h-4 w-4" />;
      case DocumentStatus.FAILED:
        return <ExclamationCircleIcon className="h-4 w-4" />;
      default:
        return <DocumentIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.UPLOADED:
        return 'text-secondary-600 bg-secondary-100';
      case DocumentStatus.PARSING:
        return 'text-warning-600 bg-warning-100';
      case DocumentStatus.COMPLETED:
        return 'text-success-600 bg-success-100';
      case DocumentStatus.FAILED:
        return 'text-error-600 bg-error-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm(`确定要删除文档 "${document.originalName}" 吗？`)) {
      onDelete?.(document);
    }
  };



  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return '📄';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return '📝';
    } else if (mimeType.includes('text')) {
      return '📃';
    } else {
      return '📄';
    }
  };

  const getStatusDisplayName = (status: DocumentStatus) => {
    const statusNames = {
      [DocumentStatus.UPLOADED]: '已上传',
      [DocumentStatus.PARSING]: '处理中',
      [DocumentStatus.COMPLETED]: '已完成',
      [DocumentStatus.FAILED]: '失败',
    };
    return statusNames[status] || status;
  };

  return (
    <div className="card hover:shadow-medium transition-all duration-200 group">
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getFileTypeIcon(document.mimeType)}</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {document.originalName}
              </h3>
              <p className="text-xs text-gray-500">
                {formatFileSize(document.fileSize)}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span className={clsx(
            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
            getStatusColor(document.status)
          )}>
            {getStatusIcon(document.status)}
            <span className="ml-1">{getStatusDisplayName(document.status)}</span>
          </span>
        </div>

        {/* Content Preview */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 space-y-1">
            <div>
              上传时间: {format(new Date(document.uploadedAt), 'yyyy年MM月dd日 HH:mm')}
            </div>
            {document.contentBlocks && document.contentBlocks.length > 0 && (
              <div>
                内容块: {document.contentBlocks.length}
              </div>
            )}
            {document.tables && document.tables.length > 0 && (
              <div>
                表格: {document.tables.length}
              </div>
            )}
            {document.figures && document.figures.length > 0 && (
              <div>
                图形: {document.figures.length}
              </div>
            )}
          </div>
        </div>

        {/* Progress for parsing documents */}
        {document.status === DocumentStatus.PARSING && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>处理中...</span>
              <span>请稍候</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-warning-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex space-x-2">
            {document.status === DocumentStatus.COMPLETED ? (
              <Link href={`/documents/${document._id}`}>
                <span className="btn-primary btn-sm">
                  <EyeIcon className="h-3 w-3 mr-1" />
                  查看
                </span>
              </Link>
            ) : (
              <button
                disabled
                className="btn-primary btn-sm btn-disabled"
              >
                <EyeIcon className="h-3 w-3 mr-1" />
                查看
              </button>
            )}
          </div>

          <button
            onClick={handleDelete}
            className="btn-ghost btn-sm text-error-600 hover:text-error-700 hover:bg-error-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <TrashIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
