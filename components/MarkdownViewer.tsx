import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Defines the props for the component, which simply accepts a markdown string.
interface MarkdownViewerProps {
  content: string;
}

/**
 * This component is responsible for rendering a Markdown string,
 * including LaTeX mathematical formulas.
 * It uses a modern and secure toolset:
 * - react-markdown: To convert Markdown into React components.
 * - remark-math: To recognize mathematical syntax ($...$ and $$...$$).
 * - rehype-katex: To render those mathematical formulas using KaTeX.
 */
const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  // Enhanced content validation
  if (!content || typeof content !== 'string') {
    return (
      <div className="text-slate-400 italic">
        [Invalid or empty content]
      </div>
    );
  }
  
  if (content.trim() === '') {
    return (
      <div className="text-slate-400 italic">
        [Empty content]
      </div>
    );
  }

  return (
    <ReactMarkdown
      // Plugins used to process the content
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
      // Provide Tailwind classes to style the Markdown content
      // This helps maintain a consistent look and feel
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
                    <p className="text-amber-300 mb-2">Code too long to display (over 50,000 characters)</p>
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
                <span className="text-red-300 text-sm">Error displaying code</span>
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