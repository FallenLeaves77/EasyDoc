import React, { useState } from 'react';
import {
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentIcon,
  FolderIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

import { IDocument, IStructureNode, StructureNodeType } from '../../types';

interface StructurePanelProps {
  document: IDocument;
}

const StructurePanel: React.FC<StructurePanelProps> = ({ document }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<IStructureNode | null>(null);

  const structureNodes = document.structureNodes || [];

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeIcon = (node: IStructureNode, isExpanded: boolean) => {
    switch (node.type) {
      case StructureNodeType.DOCUMENT:
        return <DocumentIcon className="h-4 w-4 text-blue-600" />;
      case StructureNodeType.CHAPTER:
        return isExpanded ?
          <FolderOpenIcon className="h-4 w-4 text-purple-600" /> :
          <FolderIcon className="h-4 w-4 text-purple-600" />;
      case StructureNodeType.SECTION:
        return isExpanded ?
          <FolderOpenIcon className="h-4 w-4 text-green-600" /> :
          <FolderIcon className="h-4 w-4 text-green-600" />;
      case StructureNodeType.SUBSECTION:
        return isExpanded ?
          <FolderOpenIcon className="h-4 w-4 text-orange-600" /> :
          <FolderIcon className="h-4 w-4 text-orange-600" />;
      default:
        return <DocumentIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNodeColor = (type: StructureNodeType) => {
    const colors = {
      [StructureNodeType.DOCUMENT]: 'text-blue-800',
      [StructureNodeType.CHAPTER]: 'text-purple-800',
      [StructureNodeType.SECTION]: 'text-green-800',
      [StructureNodeType.SUBSECTION]: 'text-orange-800',
      [StructureNodeType.PARAGRAPH]: 'text-gray-800',
    };
    return colors[type] || 'text-gray-800';
  };

  const renderNode = (node: IStructureNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.childIds.length > 0;
    const children = structureNodes.filter(n => node.childIds.includes(n.id));

    return (
      <div key={node.id} className="select-none">
        <div
          className={clsx(
            'flex items-center py-2 px-3 rounded-md cursor-pointer transition-colors duration-200',
            selectedNode?.id === node.id
              ? 'bg-primary-50 border border-primary-200'
              : 'hover:bg-gray-50',
            depth > 0 && 'ml-4'
          )}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => setSelectedNode(node)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-3 w-3 text-gray-500" />
              )}
            </button>
          )}

          {!hasChildren && <div className="w-4 mr-1" />}

          <div className="mr-2">
            {getNodeIcon(node, isExpanded)}
          </div>

          <div className="flex-1 min-w-0">
            <div className={clsx('text-sm font-medium truncate', getNodeColor(node.type))}>
              {node.title}
            </div>
            <div className="text-xs text-gray-500">
              {node.metadata.wordCount} 字 • 第 {node.level} 级
            </div>
          </div>

          <div className="text-xs text-gray-400">
            第 {node.position.page} 页
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-2">
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (structureNodes.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">未找到文档结构</h3>
        <p className="mt-1 text-sm text-gray-500">
          此文档没有识别到层次化结构。
        </p>
      </div>
    );
  }

  const rootNodes = structureNodes.filter(node => !node.parentId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">文档结构</h3>
            <p className="text-sm text-gray-500">
              文档内容的层次化组织
            </p>
          </div>
          <div className="card-body">
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {rootNodes.map(node => renderNode(node))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="card sticky top-4">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">节点详情</h3>
          </div>
          <div className="card-body">
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">标题</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedNode.title}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">类型</label>
                  <div className="mt-1">
                    <span className={clsx('text-sm font-medium', getNodeColor(selectedNode.type))}>
                      {selectedNode.type}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">级别</label>
                  <div className="mt-1 text-sm text-gray-900">第 {selectedNode.level} 级</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">位置</label>
                  <div className="mt-1 text-sm text-gray-900">
                    第 {selectedNode.position.page} 页，顺序 {selectedNode.position.order}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">统计信息</label>
                  <div className="mt-1 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">字数:</span>
                      <span className="text-gray-900">{selectedNode.metadata.wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">重要性:</span>
                      <span className="text-gray-900">
                        {Math.round(selectedNode.metadata.importance * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">子节点:</span>
                      <span className="text-gray-900">{selectedNode.childIds.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">内容块:</span>
                      <span className="text-gray-900">{selectedNode.contentBlockIds.length}</span>
                    </div>
                  </div>
                </div>

                {selectedNode.metadata.keywords.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">关键词</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedNode.metadata.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  选择一个结构节点查看详情
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StructurePanel;
