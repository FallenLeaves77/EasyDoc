import React, { useState, useEffect } from 'react';
import { IDocument } from '../../types';
import { processTextContent } from '../../utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MarkdownPanelProps {
  document: IDocument;
}

const MarkdownPanel: React.FC<MarkdownPanelProps> = ({ document }) => {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (document && document.contentBlocks) {
      setIsLoading(true);

      try {
        // 将内容块转换为Markdown格式
        const markdownText = generateMarkdownFromBlocks(document.contentBlocks);
        setMarkdownContent(markdownText);
      } catch (error) {
        console.error('Error generating Markdown:', error);
        setMarkdownContent('# 错误\n\n无法生成Markdown内容，请检查文档格式。');
      } finally {
        setIsLoading(false);
      }
    }
  }, [document]);

  // 将内容块转换为Markdown
  const generateMarkdownFromBlocks = (blocks: any[]): string => {
    if (!blocks || blocks.length === 0) {
      return '# 无内容\n\n文档中没有可用的内容块。';
    }

    // 按页面和位置排序内容块
    const sortedBlocks = [...blocks].sort((a, b) => {
      if (a.position.page !== b.position.page) {
        return a.position.page - b.position.page;
      }
      return a.position.y - b.position.y;
    });

    let markdown = '';
    let currentPage = 0;

    for (const block of sortedBlocks) {
      // 处理页面分隔
      if (block.position.page > currentPage) {
        if (currentPage > 0) {
          markdown += '\n\n---\n\n';
        }
        currentPage = block.position.page;
      }

      // 处理内容，根据块类型生成相应的Markdown
      const content = processTextContent(block.content || '');

      switch (block.type) {
        case 'title':
          markdown += `# ${content}\n\n`;
          break;
        case 'subtitle':
        case 'heading':
          // 根据元数据中的级别确定标题级别
          const level = (block.metadata?.level || 0) + 1;
          const headingMarks = '#'.repeat(Math.min(level, 6));
          markdown += `${headingMarks} ${content}\n\n`;
          break;
        case 'list_item':
          markdown += `- ${content}\n`;
          break;
        case 'code':
          markdown += '```\n' + content + '\n```\n\n';
          break;
        case 'quote':
          markdown += content.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
          break;
        case 'paragraph':
        default:
          markdown += `${content}\n\n`;
          break;
      }
    }

    return markdown;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">生成Markdown内容...</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Markdown 视图</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(markdownContent);
              alert('Markdown内容已复制到剪贴板');
            }}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            复制Markdown
          </button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-4 border-b">
          <h3 className="text-sm font-medium text-gray-700">预览</h3>
        </div>
        <div className="p-4 prose max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default MarkdownPanel;
