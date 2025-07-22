import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CubeTransparentIcon,
  ChartBarIcon,
  TableCellsIcon,
  PhotoIcon,
  DocumentIcon,
  ClockIcon,
  CloudArrowUpIcon,
  PlayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

import apiService from '../services/api';
import { DocumentStatus } from '../types';
import { formatFileSize, getStatusDisplayName, safeDisplayFileName } from '../utils';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ContentBlocksPanel from '../components/Analysis/ContentBlocksPanel';
import StructurePanel from '../components/Analysis/StructurePanel';
import TablesPanel from '../components/Analysis/TablesPanel';
import FiguresPanel from '../components/Analysis/FiguresPanel';
import MarkdownPanel from '../components/Analysis/MarkdownPanel';

type TabType = 'blocks' | 'structure' | 'tables' | 'figures' | 'markdown';

const DocumentView: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState<TabType>('blocks');
  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [parseProgress, setParseProgress] = useState('');
  const queryClient = useQueryClient();

  const { data: documentResponse, isLoading, error } = useQuery({
    queryKey: ['document', id],
    queryFn: () => apiService.getDocument(id as string),
    enabled: !!id && typeof id === 'string',
    refetchInterval: (query) => {
      // Refetch every 5 seconds if document is still parsing
      return query.state.data?.data?.status === DocumentStatus.PARSING ? 5000 : false;
    },
  });

  const document = documentResponse?.data;

  // 开始解析文档
  const handleStartParsing = async () => {
    if (!id || typeof id !== 'string') return;

    setIsParsingDocument(true);
    setParseProgress('正在开始解析...');

    try {
      // 调用解析API
      const parseResult = await apiService.startParsing(id, {
        mode: 'lite'
      });

      if (parseResult.success && parseResult.data?.taskId) {
        setParseProgress('解析中...');

        // 轮询解析结果
        const result = await apiService.pollParseResult(parseResult.data.taskId, {
          maxAttempts: 60,
          intervalMs: 3000,
          onProgress: (status) => {
            setParseProgress(`处理中: ${status}`);
          },
        });

        if (result.success) {
          setParseProgress('解析完成！');
          // 刷新文档数据
          queryClient.invalidateQueries({ queryKey: ['document', id] });
          setTimeout(() => {
            setParseProgress('');
            setIsParsingDocument(false);
          }, 1000);
        } else {
          throw new Error(result.error?.message || '解析失败');
        }
      } else {
        throw new Error(parseResult.error?.message || '启动解析失败');
      }
    } catch (error: any) {
      console.error('Parse error:', error);
      setParseProgress(`解析失败: ${error.message}`);
      setTimeout(() => {
        setParseProgress('');
        setIsParsingDocument(false);
      }, 3000);
    }
  };

  const tabs = [
    {
      id: 'blocks' as TabType,
      name: '内容块',
      icon: CubeTransparentIcon,
      count: document?.contentBlocks?.length || 0,
      description: '语义内容分割',
    },
    {
      id: 'structure' as TabType,
      name: '文档结构',
      icon: ChartBarIcon,
      count: document?.structureNodes?.length || 0,
      description: '分层组织',
    },
    {
      id: 'tables' as TabType,
      name: '表格',
      icon: TableCellsIcon,
      count: document?.tables?.length || 0,
      description: '结构化数据提取',
    },
    {
      id: 'figures' as TabType,
      name: '图形',
      icon: PhotoIcon,
      count: document?.figures?.length || 0,
      description: '视觉内容分析',
    },
    {
      id: 'markdown' as TabType,
      name: 'Markdown',
      icon: DocumentTextIcon,
      count: document?.contentBlocks?.length || 0,
      description: 'Markdown格式预览',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" message="正在加载文档..." />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <DocumentIcon className="mx-auto h-12 w-12 text-primary-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">正在准备文档</h3>
          <p className="mt-1 text-sm text-gray-500">
            请稍候，我们正在为您准备文档处理功能...
          </p>
          <div className="mt-6 space-y-4">
            <div className="flex justify-center">
              <LoadingSpinner size="md" />
            </div>
            <div className="flex space-x-4 justify-center">
              <Link href="/upload">
                <span className="btn-primary">
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  上传新文档
                </span>
              </Link>
              <Link href="/">
                <span className="btn-outline">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  返回仪表板
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.UPLOADED:
        return 'badge-secondary';
      case DocumentStatus.PARSING:
        return 'badge-warning';
      case DocumentStatus.COMPLETED:
        return 'badge-success';
      case DocumentStatus.FAILED:
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  };



  const renderTabContent = () => {
    if (document.status !== DocumentStatus.COMPLETED) {
      return (
        <div className="text-center py-12">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {isParsingDocument ? parseProgress :
              document.status === DocumentStatus.PARSING ? '处理中...' : '文档未解析'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isParsingDocument ? '正在解析文档内容，请稍候...' :
              document.status === DocumentStatus.PARSING
                ? '文档正在处理中。请稍候...'
                : '点击下方按钮开始解析文档内容。'
            }
          </p>
          {!isParsingDocument && document.status !== DocumentStatus.PARSING && (
            <div className="mt-6">
              <button
                onClick={handleStartParsing}
                className="btn-primary"
                disabled={isParsingDocument}
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                开始解析
              </button>
            </div>
          )}
        </div>
      );
    }

    switch (activeTab) {
      case 'blocks':
        return <ContentBlocksPanel document={document} />;
      case 'structure':
        return <StructurePanel document={document} />;
      case 'tables':
        return <TablesPanel document={document} />;
      case 'figures':
        return <FiguresPanel document={document} />;
      case 'markdown':
        return <MarkdownPanel document={document} />;
      default:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">未知标签页</h3>
            <p className="text-sm text-gray-500">当前标签页: {activeTab}</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/">
            <span className="btn-ghost btn-sm">
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              返回
            </span>
          </Link>
          <div className="h-4 w-px bg-gray-300" />
          <span className={`badge ${getStatusColor(document.status)}`}>
            {getStatusDisplayName(document.status)}
          </span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 word-break">{safeDisplayFileName(document.originalName)}</h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>📄 {formatFileSize(document.fileSize)}</span>
              <span>📅 {new Date(document.uploadedAt).toLocaleDateString()}</span>
              {document.taskId && (
                <span>🔍 任务: {document.taskId.substring(0, 8)}...</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DocumentIcon className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <tab.icon className={clsx(
                  'mr-2 h-5 w-5',
                  activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                )} />
                {tab.name}
                {tab.count > 0 && (
                  <span className={clsx(
                    'ml-2 py-0.5 px-2 rounded-full text-xs font-medium',
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Description */}
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DocumentView;
