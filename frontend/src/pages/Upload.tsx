import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

import apiService from '../services/api';
import { UploadOptions } from '../types';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Upload: React.FC = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseStatus, setParseStatus] = useState<string>('');
  const [options, setOptions] = useState<UploadOptions>({
    mode: 'lite',
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/rtf': ['.rtf'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    console.log('🔄 Upload button clicked');
    console.log('📁 Selected file:', selectedFile);

    if (!selectedFile) {
      console.error('❌ No file selected');
      return;
    }

    console.log('🚀 Starting upload process...');
    setIsUploading(true);
    setUploadProgress(0);
    setParseStatus('正在上传文件...');

    try {
      console.log('📤 Calling uploadAndParse API...');
      // Upload and start parsing
      const result = await apiService.uploadAndParse(selectedFile, options);

      setUploadProgress(50);
      setParseStatus('文件已上传，开始分析...');

      // Poll for results
      const parseResult = await apiService.pollParseResult(result.taskId, {
        maxAttempts: 60,
        intervalMs: 3000,
        onProgress: (status) => {
          setParseStatus(`处理中: ${status}`);
          if (status === 'PROGRESSING') {
            setUploadProgress(Math.min(90, uploadProgress + 10));
          }
        },
      });

      if (parseResult.success) {
        setUploadProgress(100);
        setParseStatus('分析完成！');
        toast.success('文档处理成功！');

        // Navigate to document view after a short delay
        setTimeout(() => {
          router.push(`/documents/${result.document._id}`);
        }, 1000);
      } else {
        throw new Error(parseResult.error?.message || '处理失败');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || '上传失败');
      setParseStatus('');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setParseStatus('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['字节', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">上传文档</h1>
        <p className="mt-2 text-gray-600">
          上传您的文档以开始高级处理，包括内容块识别、分层结构分析和表格图形理解。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-body">
              {!selectedFile ? (
                <div
                  {...getRootProps()}
                  className={clsx(
                    'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200',
                    isDragActive
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                  )}
                >
                  <input {...getInputProps()} />
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    {isDragActive ? '将文件拖放到此处' : '上传文档'}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    将文件拖放到此处，或点击浏览
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    支持 PDF、DOC、DOCX、TXT、RTF 格式（最大 50MB）
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected File */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="h-8 w-8 text-primary-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={handleRemoveFile}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{parseStatus}</span>
                        <span className="text-gray-500">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Upload Button */}
                  {!isUploading ? (
                    <button
                      onClick={(e) => {
                        console.log('🖱️ Button clicked!', e);
                        handleUpload();
                      }}
                      className="w-full btn-primary"
                      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    >
                      <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                      开始处理
                    </button>
                  ) : (
                    <div className="flex items-center justify-center py-2">
                      <LoadingSpinner size="sm" message="处理中..." />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Options Panel */}
        <div className="space-y-6">
          {/* Processing Options */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">处理选项</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="form-label">处理模式</label>
                <select
                  value={options.mode}
                  onChange={(e) => setOptions({ ...options, mode: e.target.value as 'lite' | 'pro' })}
                  className="form-input"
                  disabled={isUploading}
                >
                  <option value="lite">精简模式（更快）</option>
                  <option value="pro">专业模式（更详细）</option>
                </select>
                <p className="form-help">
                  精简模式更快但不够详细。专业模式提供全面分析。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">起始页</label>
                  <input
                    type="number"
                    min="1"
                    value={options.startPage || ''}
                    onChange={(e) => setOptions({
                      ...options,
                      startPage: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="form-input"
                    placeholder="1"
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <label className="form-label">结束页</label>
                  <input
                    type="number"
                    min="1"
                    value={options.endPage || ''}
                    onChange={(e) => setOptions({
                      ...options,
                      endPage: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="form-input"
                    placeholder="全部"
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Features Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">您将获得</h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-start space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">内容块识别</p>
                  <p className="text-xs text-gray-500">智能文本分割为语义块</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">文档结构分析</p>
                  <p className="text-xs text-gray-500">分层组织和思维导图</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-success-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">表格和图形理解</p>
                  <p className="text-xs text-gray-500">结构化数据提取和分析</p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="card border-warning-200 bg-warning-50">
            <div className="card-body">
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warning-800">处理时间</p>
                  <p className="text-xs text-warning-700">
                    大型文档可能需要几分钟来处理。请耐心等待。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
