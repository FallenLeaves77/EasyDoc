import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

import { IDocument, IContentBlock, ContentBlockType } from '../../types';
import { getContentBlockTypeDisplayName } from '../../utils';

// 安全显示文本内容的函数
const safeDisplayText = (text: string): string => {
  if (!text) return '';

  let cleanText = text.trim();

  // 处理可能的HTML内容，转换为纯文本
  if (cleanText.includes('<') && cleanText.includes('>')) {
    // 简单的HTML到文本转换，避免HTML乱码
    cleanText = cleanText
      .replace(/<[^>]*>/g, ' ') // 移除HTML标签
      .replace(/&nbsp;/g, ' ') // 替换HTML实体
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim();
  }

  // 移除可能的控制字符和无效字符
  cleanText = cleanText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 处理可能的编码问题
  try {
    // 检测并处理常见的乱码模式
    if (cleanText.includes('�') || /[\uFFFD\uFEFF]/.test(cleanText)) {
      console.warn('Detected potential encoding issues in text:', cleanText.substring(0, 50));

      // 如果整个文本都是乱码，显示友好提示
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
    let detectedPattern = null;
    for (const pattern of commonGarbledPatterns) {
      if (pattern.test(cleanText)) {
        hasGarbledContent = true;
        detectedPattern = pattern;
        console.warn('Detected garbled content pattern:', pattern);
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

      console.log('Applied encoding fix for pattern:', detectedPattern);
    }

    // 确保文本是有效的UTF-8并规范化
    cleanText = cleanText.normalize('NFC');

    // 移除控制字符但保留换行符和制表符
    cleanText = cleanText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 如果文本过短且可能是乱码，显示提示
    if (cleanText.length < 10 && /[^\u4e00-\u9fa5\u0020-\u007E\u3000-\u303F\uFF00-\uFFEF]/.test(cleanText)) {
      return '[内容可能存在编码问题，建议重新上传文档]';
    }

    // 检查是否还有大量未识别字符
    const unrecognizedRatio = (cleanText.match(/[^\u4e00-\u9fa5\u0020-\u007E\u3000-\u303F\uFF00-\uFFEF\s]/g) || []).length / cleanText.length;
    if (unrecognizedRatio > 0.3) {
      return '[文档包含大量无法识别的字符，可能存在编码问题]';
    }

    return cleanText;
  } catch (error) {
    console.error('Error processing text content:', error);
    return '[文本处理错误，请检查文档格式]'; // 返回友好的错误提示
  }
};

interface ContentBlocksPanelProps {
  document: IDocument;
}

const ContentBlocksPanel: React.FC<ContentBlocksPanelProps> = ({ document }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ContentBlockType | 'all'>('all');
  const [selectedBlock, setSelectedBlock] = useState<IContentBlock | null>(null);

  const contentBlocks = document.contentBlocks || [];

  // Filter blocks based on search and type
  const filteredBlocks = contentBlocks.filter(block => {
    const matchesSearch = searchTerm === '' ||
      safeDisplayText(block.content).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (block.metadata.semanticTags || []).some(tag =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesType = selectedType === 'all' || block.type === selectedType;

    return matchesSearch && matchesType;
  });

  // Get unique block types
  const blockTypes = Array.from(new Set(contentBlocks.map(block => block.type)));

  const getBlockTypeColor = (type: ContentBlockType) => {
    const colors = {
      [ContentBlockType.TITLE]: 'bg-purple-100 text-purple-800',
      [ContentBlockType.HEADING]: 'bg-blue-100 text-blue-800',
      [ContentBlockType.PARAGRAPH]: 'bg-gray-100 text-gray-800',
      [ContentBlockType.LIST]: 'bg-green-100 text-green-800',
      [ContentBlockType.QUOTE]: 'bg-yellow-100 text-yellow-800',
      [ContentBlockType.CODE]: 'bg-red-100 text-red-800',
      [ContentBlockType.TABLE]: 'bg-indigo-100 text-indigo-800',
      [ContentBlockType.FIGURE]: 'bg-pink-100 text-pink-800',
      [ContentBlockType.CAPTION]: 'bg-orange-100 text-orange-800',
      [ContentBlockType.FOOTER]: 'bg-gray-100 text-gray-600',
      [ContentBlockType.HEADER]: 'bg-gray-100 text-gray-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getBlockTypeIcon = (type: ContentBlockType) => {
    switch (type) {
      case ContentBlockType.TITLE:
        return '📋';
      case ContentBlockType.HEADING:
        return '📝';
      case ContentBlockType.PARAGRAPH:
        return '📄';
      case ContentBlockType.LIST:
        return '📋';
      case ContentBlockType.QUOTE:
        return '💬';
      case ContentBlockType.CODE:
        return '💻';
      case ContentBlockType.TABLE:
        return '📊';
      case ContentBlockType.FIGURE:
        return '🖼️';
      case ContentBlockType.CAPTION:
        return '🏷️';
      default:
        return '📄';
    }
  };



  // 检查文档状态
  if (document.status === 'failed') {
    const errorMessage = document.parseResult?.errMessage || document.errorMessage || '文档解析失败';
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-red-900">文档解析失败</h3>
        <p className="mt-1 text-sm text-red-600">
          {errorMessage}
        </p>
        <div className="mt-4 text-xs text-gray-500">
          <p>建议解决方案：</p>
          <ul className="mt-2 text-left max-w-md mx-auto space-y-1">
            <li>• 检查网络连接是否稳定</li>
            <li>• 尝试上传较小的文件（建议小于10MB）</li>
            <li>• 确保文件格式正确（PDF、DOCX、DOC、TXT、RTF）</li>
            <li>• 稍后重试</li>
          </ul>
        </div>
      </div>
    );
  }

  if (contentBlocks.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">未找到内容块</h3>
        <p className="mt-1 text-sm text-gray-500">
          此文档没有识别到任何内容块。可能是文档格式不支持或内容解析失败。
        </p>
        <div className="mt-4 text-xs text-gray-400">
          <p>支持的文档格式：PDF、DOCX、DOC、TXT、RTF</p>
          <p>如果问题持续存在，请尝试重新上传文档</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Filters and List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索内容块..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ContentBlockType | 'all')}
              className="form-input pl-10 pr-8"
            >
              <option value="all">所有类型</option>
              {blockTypes.map(type => (
                <option key={type} value={type}>
                  {getContentBlockTypeDisplayName(type)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500">
          显示 {filteredBlocks.length} / {contentBlocks.length} 个内容块
        </div>

        {/* Content Blocks List */}
        <div className="space-y-3">
          {filteredBlocks.map((block) => (
            <div
              key={block.id}
              onClick={() => setSelectedBlock(block)}
              className={clsx(
                'card cursor-pointer transition-all duration-200 hover:shadow-medium',
                selectedBlock?.id === block.id ? 'ring-2 ring-primary-500' : ''
              )}
            >
              <div className="card-body">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getBlockTypeIcon(block.type)}</span>
                    <span className={`badge ${getBlockTypeColor(block.type)}`}>
                      {getContentBlockTypeDisplayName(block.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      第 {block.position.page} 页
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {block.metadata.wordCount} 字
                  </div>
                </div>

                <div className="text-sm text-gray-900 line-clamp-3 mb-2">
                  {safeDisplayText(block.content)}
                </div>

                {block.metadata.semanticTags && block.metadata.semanticTags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <TagIcon className="h-3 w-3 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {block.metadata.semanticTags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                        >
                          {tag}
                        </span>
                      ))}
                      {block.metadata.semanticTags.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{block.metadata.semanticTags.length - 3} 个
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredBlocks.length === 0 && (
          <div className="text-center py-8">
            <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">未找到内容块</h3>
            <p className="mt-1 text-sm text-gray-500">
              请尝试调整搜索或筛选条件。
            </p>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      <div className="lg:col-span-1">
        <div className="card sticky top-4">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">块详情</h3>
          </div>
          <div className="card-body">
            {selectedBlock ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">类型</label>
                  <div className="mt-1">
                    <span className={`badge ${getBlockTypeColor(selectedBlock.type)}`}>
                      {getContentBlockTypeDisplayName(selectedBlock.type)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">位置</label>
                  <div className="mt-1 text-sm text-gray-600">
                    第 {selectedBlock.position.page} 页 •
                    ({selectedBlock.position.x}, {selectedBlock.position.y})
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">内容</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm text-gray-900 max-h-40 overflow-y-auto">
                    {safeDisplayText(selectedBlock.content)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">元数据</label>
                  <div className="mt-1 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">字数:</span>
                      <span className="text-gray-900">{selectedBlock.metadata.wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">置信度:</span>
                      <span className="text-gray-900">
                        {Math.round(selectedBlock.metadata.confidence * 100)}%
                      </span>
                    </div>
                    {selectedBlock.metadata.language && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">语言:</span>
                        <span className="text-gray-900">{selectedBlock.metadata.language}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBlock.metadata.semanticTags && selectedBlock.metadata.semanticTags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">语义标签</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedBlock.metadata.semanticTags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  选择一个内容块查看详情
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentBlocksPanel;
