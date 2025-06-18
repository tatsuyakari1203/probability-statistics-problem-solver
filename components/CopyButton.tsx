
import React, { useState, useCallback } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from './icons/SolutionIcons';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  tooltipText?: string;
  copiedTooltipText?: string;
  size?: 'sm' | 'md'; 
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  className = '',
  tooltipText = 'Copy to clipboard',
  copiedTooltipText = 'Copied!',
  size = 'sm', 
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const iconSizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  const handleCopy = useCallback(async () => {
    // Enhanced validation and type checking
    if (textToCopy === null || textToCopy === undefined) {
      console.warn("Attempted to copy null or undefined value.");
      return;
    }
    
    if (typeof textToCopy !== 'string') {
      console.warn("Attempted to copy non-string value:", typeof textToCopy);
      return;
    }
    
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setIsCopied(true);
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr);
        } finally {
          document.body.removeChild(textArea);
        }
      } else {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
      }
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      // Could add a toast notification here for better UX
    }
  }, [textToCopy]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`p-2 hover:bg-slate-700/50 focus:outline-none focus:bg-slate-700/70 transition-all duration-200 relative group border-l-2 border-transparent hover:border-sky-400 ${className}`}
      aria-label={isCopied ? copiedTooltipText : tooltipText}
      title={isCopied ? copiedTooltipText : tooltipText}
    >
      {isCopied ? (
        <CheckIcon className={`${iconSizeClass} text-green-400`} />
      ) : (
        <ClipboardDocumentIcon className={`${iconSizeClass} text-slate-400 group-hover:text-sky-400 transition-colors duration-200`} />
      )}
    </button>
  );
};
