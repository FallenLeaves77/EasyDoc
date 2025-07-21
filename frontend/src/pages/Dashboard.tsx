import React from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  CubeTransparentIcon,
  ChartBarIcon,
  PhotoIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import {
  DocumentIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/solid';

import apiService from '../services/api';
import { DocumentStatus, IDocument } from '../types';
import DocumentCard from '../components/Documents/DocumentCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: documentsResponse, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiService.getDocuments({ page: 1, limit: 6 }),
    refetchInterval: 5000, // Refresh every 5 seconds to update parsing status
  });

  // 删除文档的mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => apiService.deleteDocument(documentId),
    onSuccess: () => {
      // 删除成功后刷新文档列表
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      console.error('删除文档失败:', error);
      alert('删除文档失败，请重试');
    },
  });

  const documents = documentsResponse?.data?.documents || [];
  const stats = {
    total: documentsResponse?.data?.total || 0,
    uploaded: documents.filter(d => d.status === DocumentStatus.UPLOADED).length,
    parsing: documents.filter(d => d.status === DocumentStatus.PARSING).length,
    completed: documents.filter(d => d.status === DocumentStatus.COMPLETED).length,
    failed: documents.filter(d => d.status === DocumentStatus.FAILED).length,
  };

  // 处理删除文档
  const handleDeleteDocument = (document: IDocument) => {
    deleteDocumentMutation.mutate(document._id);
  };

  const features = [
    {
      name: '内容块识别',
      description: '将分散的文本转换为LLM就绪的知识块',
      icon: CubeTransparentIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: '分层文档结构',
      description: '重构创意思维导图并提供更深层的结构化上下文',
      icon: ChartBarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: '表格和图形理解',
      description: '将复杂的表格和图形转换为结构化知识',
      icon: PhotoIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" message="正在加载仪表板..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-error-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">加载仪表板时出错</h3>
          <p className="mt-1 text-sm text-gray-500">请尝试刷新页面。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">仪表板</h1>
        <p className="mt-2 text-gray-600">
          欢迎使用 EasyDoc2 - 高级文档处理平台
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">文档总数</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">处理中</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.parsing}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">已完成</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-8 w-8 text-error-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">失败</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.failed}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">核心功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.name} className="card hover:shadow-medium transition-shadow duration-200">
              <div className="card-body">
                <div className="flex items-center mb-3">
                  <div className={`flex-shrink-0 p-2 rounded-lg ${feature.bgColor}`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{feature.name}</h3>
                </div>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Documents */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">最近文档</h2>
          <Link href="/upload">
            <span className="btn-primary btn-sm">
              <PlusIcon className="h-4 w-4 mr-1" />
              上传新文档
            </span>
          </Link>
        </div>

        {documents.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">暂无文档</h3>
              <p className="mt-1 text-sm text-gray-500">
                点击右上角的"上传新文档"按钮开始使用。
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((document) => (
              <DocumentCard
                key={document._id}
                document={document}
                onDelete={handleDeleteDocument}
              />
            ))}
          </div>
        )}

        {documents.length > 0 && stats.total > documents.length && (
          <div className="mt-6 text-center">
            <Link href="/documents">
              <span className="btn-outline">
                查看所有文档 ({stats.total})
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">快速操作</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">查看文档</p>
                <p className="text-sm text-gray-500">了解功能和API</p>
              </div>
            </button>

            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">查看分析</p>
                <p className="text-sm text-gray-500">查看处理统计信息</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
