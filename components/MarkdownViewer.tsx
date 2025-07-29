import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Định nghĩa props cho component, chỉ cần nhận vào một chuỗi markdown
interface MarkdownViewerProps {
  content: string;
}

/**
 * Component này chịu trách nhiệm hiển thị một chuỗi Markdown,
 * bao gồm cả các công thức toán học LaTeX.
 * Nó sử dụng bộ công cụ hiện đại và an toàn:
 * - react-markdown: Để chuyển đổi Markdown thành component React.
 * - remark-math: Để nhận diện cú pháp toán học ($...$ và $$...$$).
 * - rehype-katex: Để hiển thị các công thức toán học đó bằng KaTeX.
 */
const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  // Enhanced content validation
  if (!content || typeof content !== 'string') {
    return (
      <div className="text-slate-400 italic">
        [Nội dung không hợp lệ hoặc trống]
      </div>
    );
  }
  
  if (content.trim() === '') {
    return (
      <div className="text-slate-400 italic">
        [Nội dung trống]
      </div>
    );
  }

  return (
    <ReactMarkdown
      // Các plugin được sử dụng để xử lý nội dung
      remarkPlugins={[remarkMath]}
      rehypePlugins={[[rehypeKatex, {
        strict: false,
        trust: true,
        macros: {
          "\\RR": "\\mathbb{R}",
          "\\NN": "\\mathbb{N}",
          "\\ZZ": "\\mathbb{Z}",
          "\\QQ": "\\mathbb{Q}",
          "\\CC": "\\mathbb{C}"
        }
      }]]}
      // Cung cấp các class của Tailwind để tạo kiểu cho nội dung Markdown
      // Điều này giúp bạn kiểm soát giao diện một cách nhất quán
      components={{
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2" {...props} />,
        p: ({node, ...props}) => <p className="mb-4" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4" {...props} />,
        li: ({node, ...props}) => <li className="mb-2" {...props} />,
        code: ({node, className, children, ...props}) => {
          try {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (match) {
              // Enhanced validation for code content
              const codeContent = String(children).replace(/\n$/, '');
              
              if (codeContent.length > 50000) {
                return (
                  <div className="bg-slate-800 p-4 rounded border border-amber-500">
                    <p className="text-amber-300 mb-2">Mã quá dài để hiển thị (hơn 50,000 ký tự)</p>
                    <pre className="text-slate-300 text-sm overflow-hidden">
                      {codeContent.substring(0, 1000)}...
                    </pre>
                  </div>
                );
              }
              
              return (
                <SyntaxHighlighter
                  style={dracula as any}
                  language={language || 'python'}
                  PreTag="div"
                  className="my-4"
                  customStyle={{
                    padding: '1rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    borderRadius: '0.5rem'
                  }}
                >
                  {codeContent}
                </SyntaxHighlighter>
              );
            }
            
            return (
              <code className="bg-gray-200 text-gray-800 rounded px-1 py-0.5" {...props}>
                {children}
              </code>
            );
          } catch (error) {
            console.error('Error rendering code block:', error);
            return (
              <div className="bg-red-900/20 border border-red-500 p-2 rounded">
                <span className="text-red-300 text-sm">Lỗi hiển thị mã</span>
              </div>
            );
          }
        },
        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-400 pl-4 italic my-4" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownViewer;