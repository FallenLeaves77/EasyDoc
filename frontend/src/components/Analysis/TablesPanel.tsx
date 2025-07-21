import React, { useState } from 'react';
import {
  TableCellsIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

import { IDocument, ITableData, ITableCell } from '../../types';

interface TablesPanelProps {
  document: IDocument;
}

const TablesPanel: React.FC<TablesPanelProps> = ({ document }) => {
  const [selectedTable, setSelectedTable] = useState<ITableData | null>(null);

  const tables = document.tables || [];

  const exportTableAsCSV = (table: ITableData) => {
    const csvContent = table.data.map(row =>
      row.map(cell => `"${cell.value.replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `table_${table.id}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderTablePreview = (table: ITableData) => {
    const maxRows = 5;
    const maxCols = 6;
    const previewData = table.data.slice(0, maxRows).map(row => row.slice(0, maxCols));

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {previewData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={clsx(
                      'px-3 py-2 text-xs text-gray-900 border-r border-gray-200',
                      cell.isHeader && 'bg-gray-50 font-medium'
                    )}
                  >
                    <div className="max-w-32 truncate" title={cell.value}>
                      {cell.value || '-'}
                    </div>
                  </td>
                ))}
                {table.data[rowIndex]?.length > maxCols && (
                  <td className="px-3 py-2 text-xs text-gray-400">
                    +{table.data[rowIndex].length - maxCols} 列
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {table.data.length > maxRows && (
          <div className="text-center py-2 text-xs text-gray-400 border-t">
            +{table.data.length - maxRows} 行
          </div>
        )}
      </div>
    );
  };

  const renderFullTable = (table: ITableData) => {
    return (
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {table.data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={clsx(
                      'px-3 py-2 text-sm text-gray-900 border-r border-gray-200',
                      cell.isHeader && 'bg-gray-50 font-medium'
                    )}
                    colSpan={cell.colspan || 1}
                    rowSpan={cell.rowspan || 1}
                  >
                    {cell.value || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <TableCellsIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">未找到表格</h3>
        <p className="mt-1 text-sm text-gray-500">
          此文档不包含任何已识别的表格。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tables List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tables.map((table, index) => (
          <div key={table.id} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {table.metadata.title || `表格 ${index + 1}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {table.structure.rows} 行 × {table.structure.columns} 列
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedTable(table)}
                    className="btn-ghost btn-sm"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => exportTableAsCSV(table)}
                    className="btn-ghost btn-sm"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {table.metadata.caption && (
                <p className="text-sm text-gray-600 mb-3">{table.metadata.caption}</p>
              )}

              <div className="mb-3">
                {renderTablePreview(table)}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>第 {table.position.page} 页</span>
                <span>置信度: {Math.round(table.metadata.confidence * 100)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Table Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedTable.metadata.title || '表格详情'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedTable.structure.rows} 行 × {selectedTable.structure.columns} 列
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportTableAsCSV(selectedTable)}
                  className="btn-primary btn-sm"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  导出 CSV
                </button>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="btn-ghost btn-sm"
                >
                  关闭
                </button>
              </div>
            </div>

            <div className="p-6">
              {selectedTable.metadata.caption && (
                <p className="text-sm text-gray-600 mb-4">{selectedTable.metadata.caption}</p>
              )}

              {renderFullTable(selectedTable)}

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">位置:</span>
                  <div className="font-medium">第 {selectedTable.position.page} 页</div>
                </div>
                <div>
                  <span className="text-gray-500">置信度:</span>
                  <div className="font-medium">{Math.round(selectedTable.metadata.confidence * 100)}%</div>
                </div>
                <div>
                  <span className="text-gray-500">包含表头:</span>
                  <div className="font-medium">{selectedTable.structure.hasHeader ? '是' : '否'}</div>
                </div>
                <div>
                  <span className="text-gray-500">数据类型:</span>
                  <div className="font-medium">{selectedTable.metadata.dataTypes.join(', ')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesPanel;
