import React, { useState } from 'react';
import {
  PhotoIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

import { IDocument, IFigureData, FigureType } from '../../types';

interface FiguresPanelProps {
  document: IDocument;
}

const FiguresPanel: React.FC<FiguresPanelProps> = ({ document }) => {
  const [selectedFigure, setSelectedFigure] = useState<IFigureData | null>(null);

  const figures = document.figures || [];

  const getFigureTypeColor = (type: FigureType) => {
    const colors = {
      [FigureType.IMAGE]: 'bg-blue-100 text-blue-800',
      [FigureType.CHART]: 'bg-green-100 text-green-800',
      [FigureType.DIAGRAM]: 'bg-purple-100 text-purple-800',
      [FigureType.GRAPH]: 'bg-orange-100 text-orange-800',
      [FigureType.ILLUSTRATION]: 'bg-pink-100 text-pink-800',
      [FigureType.PHOTO]: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getFigureTypeIcon = (type: FigureType) => {
    switch (type) {
      case FigureType.CHART:
        return '📊';
      case FigureType.DIAGRAM:
        return '📋';
      case FigureType.GRAPH:
        return '📈';
      case FigureType.ILLUSTRATION:
        return '🎨';
      case FigureType.PHOTO:
        return '📷';
      default:
        return '🖼️';
    }
  };

  if (figures.length === 0) {
    return (
      <div className="text-center py-12">
        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">未找到图形</h3>
        <p className="mt-1 text-sm text-gray-500">
          此文档不包含任何已识别的图形或图像。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Figures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {figures.map((figure, index) => (
          <div key={figure.id} className="card hover:shadow-medium transition-shadow duration-200">
            <div className="card-body">
              {/* Figure Preview */}
              <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {figure.content.imageUrl ? (
                  <img
                    src={figure.content.imageUrl}
                    alt={figure.content.altText || figure.content.description}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={clsx(
                  'flex flex-col items-center justify-center text-gray-400',
                  figure.content.imageUrl && 'hidden'
                )}>
                  <span className="text-4xl mb-2">{getFigureTypeIcon(figure.type)}</span>
                  <span className="text-sm">{figure.type}</span>
                </div>
              </div>

              {/* Figure Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`badge ${getFigureTypeColor(figure.type)}`}>
                      {figure.type}
                    </span>
                    {figure.metadata?.isReference && (
                      <span className="badge bg-yellow-100 text-yellow-800">
                        引用
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    第 {figure.position.page} 页
                  </span>
                </div>

                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {figure.content.caption || figure.content.description || `图形 ${index + 1}`}
                </h4>

                <p className="text-xs text-gray-600 line-clamp-3">
                  {figure.content.description}
                </p>

                {figure.metadata.extractedText && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    文本: {figure.metadata.extractedText}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">
                    置信度: {Math.round(figure.metadata.confidence * 100)}%
                  </span>
                  <button
                    onClick={() => setSelectedFigure(figure)}
                    className="btn-ghost btn-sm"
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    查看
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Figure Detail Modal */}
      {selectedFigure && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedFigure.content.caption || '图形详情'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedFigure.type} • 第 {selectedFigure.position.page} 页
                </p>
              </div>
              <button
                onClick={() => setSelectedFigure(null)}
                className="btn-ghost btn-sm"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Figure Display */}
                <div>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {selectedFigure.content.imageUrl ? (
                      <img
                        src={selectedFigure.content.imageUrl}
                        alt={selectedFigure.content.altText || selectedFigure.content.description}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={clsx(
                      'flex flex-col items-center justify-center text-gray-400',
                      selectedFigure.content.imageUrl && 'hidden'
                    )}>
                      <span className="text-6xl mb-4">{getFigureTypeIcon(selectedFigure.type)}</span>
                      <span className="text-lg">{selectedFigure.type}</span>
                    </div>
                  </div>
                </div>

                {/* Figure Details */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">类型</label>
                    <div className="mt-1">
                      <span className={`badge ${getFigureTypeColor(selectedFigure.type)}`}>
                        {selectedFigure.type}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">描述</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedFigure.content.description}
                    </div>
                  </div>

                  {selectedFigure.content.caption && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">标题</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {selectedFigure.content.caption}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700">位置</label>
                    <div className="mt-1 text-sm text-gray-900">
                      第 {selectedFigure.position.page} 页 •
                      ({selectedFigure.position.x}, {selectedFigure.position.y}) •
                      {selectedFigure.position.width}×{selectedFigure.position.height}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">元数据</label>
                    <div className="mt-1 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">置信度:</span>
                        <span className="text-gray-900">
                          {Math.round(selectedFigure.metadata.confidence * 100)}%
                        </span>
                      </div>
                      {selectedFigure.metadata.extractedText && (
                        <div>
                          <span className="text-gray-500">提取的文本:</span>
                          <div className="mt-1 p-2 bg-gray-50 rounded text-gray-900">
                            {selectedFigure.metadata.extractedText}
                          </div>
                        </div>
                      )}
                      {selectedFigure.metadata.colors && selectedFigure.metadata.colors.length > 0 && (
                        <div>
                          <span className="text-gray-500">颜色:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedFigure.metadata.colors.map((color, index) => (
                              <span
                                key={index}
                                className="inline-block w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedFigure.metadata.objects && selectedFigure.metadata.objects.length > 0 && (
                        <div>
                          <span className="text-gray-500">检测到的对象:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedFigure.metadata.objects.map((object, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {object}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiguresPanel;
