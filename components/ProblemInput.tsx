
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from '../constants';
import { PhotoIcon, DocumentTextIcon, SparklesIcon, ClipboardIcon, AcademicCapIcon } from './icons/InputIcons';

interface ProblemInputProps {
  onSubmit: (problemText: string, imageBase64: string | null, isAdvancedMode: boolean) => void;
  isLoading: boolean;
}

export const ProblemInput: React.FC<ProblemInputProps> = ({ onSubmit, isLoading }) => {
  const [problemText, setProblemText] = useState<string>('');
  const [problemImage, setProblemImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDropZoneRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback((file: File): boolean => {
    // Enhanced file validation
    if (!file || !(file instanceof File)) {
      setInputError('Tệp không hợp lệ.');
      return false;
    }

    if (file.size === 0) {
      setInputError('Tệp trống. Vui lòng chọn tệp khác.');
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setInputError(`Kích thước hình ảnh không được vượt quá ${MAX_IMAGE_SIZE_MB}MB.`);
      setProblemImage(null);
      setImageBase64(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return false;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setInputError('Định dạng hình ảnh không được hỗ trợ. Vui lòng chọn JPG, PNG hoặc WEBP.');
      setProblemImage(null);
      setImageBase64(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return false;
    }

    setProblemImage(file);
    setInputError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const result = reader.result;
        if (typeof result === 'string') {
          setImageBase64(result);
          setPreviewUrl(result);
        } else {
          throw new Error('Kết quả đọc tệp không hợp lệ.');
        }
      } catch (error) {
        setInputError('Lỗi xử lý tệp hình ảnh.');
        setProblemImage(null);
        setImageBase64(null);
        setPreviewUrl(null);
      }
    };
    reader.onerror = () => {
        setInputError('Không thể đọc tệp hình ảnh.');
        setProblemImage(null);
        setImageBase64(null);
        setPreviewUrl(null);
    }
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      setInputError('Lỗi đọc tệp hình ảnh.');
      setProblemImage(null);
      setImageBase64(null);
      setPreviewUrl(null);
      return false;
    }
    return true;
  }, []);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProblemText(event.target.value);
    if (inputError && (event.target.value.trim() || imageBase64)) setInputError(null);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeImage = () => {
    setProblemImage(null);
    setImageBase64(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    if (inputError && problemText.trim()) setInputError(null);
  };

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    
    // Enhanced validation
    const trimmedText = problemText?.trim() || '';
    
    if (!trimmedText && !imageBase64) {
      setInputError('Vui lòng nhập mô tả bài toán hoặc tải lên/dán hình ảnh.');
      return;
    }
    
    if (trimmedText.length > 10000) {
      setInputError('Mô tả bài toán quá dài. Vui lòng rút gọn dưới 10,000 ký tự.');
      return;
    }
    
    setInputError(null);
    onSubmit(trimmedText, imageBase64, isAdvancedMode);
  }, [problemText, imageBase64, onSubmit, isAdvancedMode]);

  const handleDirectPaste = useCallback(async (event: ClipboardEvent) => {
    if (isLoading) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          event.preventDefault(); 
          if(processFile(file)) {
            if (fileInputRef.current) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              fileInputRef.current.files = dataTransfer.files;
            }
          }
          break; 
        }
      }
    }
  }, [isLoading, processFile]);

  const handlePasteButtonClick = async () => {
      if (isLoading) return;
      setInputError(null); 
      try {
        if (!navigator.clipboard || !navigator.clipboard.read) {
          setInputError('Browser does not support pasting from clipboard. Try Ctrl+V or select a file.');
          return;
        }
        const clipboardItems = await navigator.clipboard.read();
        let imageFound = false;
        for (const item of clipboardItems) {
          const imageType = item.types.find(type => type.startsWith('image/'));
          if (imageType && ALLOWED_IMAGE_TYPES.includes(imageType)) {
            const blob = await item.getType(imageType);
            const fileExtension = imageType.split('/')[1] || 'png';
            const file = new File([blob], `pasted_image.${fileExtension}`, { type: imageType });
            
            if (processFile(file)) {
                if (fileInputRef.current) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInputRef.current.files = dataTransfer.files;
                }
            }
            imageFound = true;
            break; 
          } else if (imageType && !ALLOWED_IMAGE_TYPES.includes(imageType)) {
            setInputError(`Image format from clipboard (${imageType}) is not supported. Please use JPG, PNG, or WEBP.`);
            return;
          }
        }
        if (!imageFound) {
          setInputError('No valid image found in clipboard.');
        }
      } catch (err) {
        console.error('Error pasting from clipboard:', err);
        if (err instanceof Error && err.name === 'NotAllowedError') {
             setInputError('Clipboard access denied. Please allow permission or try Ctrl+V.');
        } else {
            setInputError('Could not paste from clipboard. Try Ctrl+V or select a file.');
        }
      }
    };

  useEffect(() => {
    const dropZone = imageDropZoneRef.current;
    if (dropZone) {
      dropZone.addEventListener('paste', handleDirectPaste as EventListener);
      return () => {
        dropZone.removeEventListener('paste', handleDirectPaste as EventListener);
      };
    }
  }, [handleDirectPaste]);


  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-6 bg-slate-900/30 border-l-4 border-sky-400 animate-fade-in">
      <div>
        <label htmlFor="problemText" className="block text-lg font-medium text-sky-300 mb-3">
          <DocumentTextIcon className="inline h-6 w-6 mr-2 align-bottom" />
          Problem Description
        </label>
        <textarea
          id="problemText"
          value={problemText}
          onChange={handleTextChange}
          rows={5}
          className="w-full p-4 bg-slate-800/50 border-l-3 border-slate-600 focus:border-l-3 focus:border-sky-400 text-slate-100 placeholder-slate-400 transition-all duration-200 resize-none"
          placeholder="Example: Calculate the probability of rolling a 5 on a six-sided die."
          disabled={isLoading}
        />
      </div>

      <div 
        ref={imageDropZoneRef} 
        className="p-8 bg-slate-800/30 border-l-3 border-slate-600 hover:border-sky-400 hover:bg-slate-800/50 transition-all duration-200 text-center"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation();}}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
          }
        }}
      >
        <div 
            className="cursor-pointer" 
            onClick={() => !isLoading && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') !isLoading && fileInputRef.current?.click()}}
            aria-label={`Upload problem image (max ${MAX_IMAGE_SIZE_MB}MB) or drag and drop here`}
        >
            <PhotoIcon className="mx-auto h-12 w-12 text-sky-400/80 mb-3" />
            <p className="text-base font-medium text-sky-300">
              Drag & drop or click to select image
            </p>
            <p className="text-sm text-slate-400 mt-2">
                (Max {MAX_IMAGE_SIZE_MB}MB, JPG, PNG, WEBP format)
            </p>
            <input
              type="file"
              id="problemImage"
              ref={fileInputRef}
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleImageChange}
              className="hidden"
              disabled={isLoading}
            />
        </div>
         
        <div className="mt-6 text-sm text-slate-400">
            <p className="flex items-center justify-center mb-3">
                <ClipboardIcon className="inline h-5 w-5 mr-2 text-slate-400" />
                Or use Ctrl+V to paste an image into this area.
            </p>
            <button
              type="button"
              onClick={handlePasteButtonClick}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border-l-3 border-sky-600 text-sm font-medium text-sky-200 bg-sky-700/50 hover:bg-sky-600/70 hover:border-sky-400 focus:outline-none focus:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              aria-label="Paste image from clipboard"
            >
              <ClipboardIcon className="h-5 w-5 mr-2" />
              Paste from Clipboard
            </button>
        </div>

        {previewUrl && (
          <div className="mt-6 relative group inline-block">
            <img src={previewUrl} alt="Image preview" className="max-h-52 border-l-3 border-slate-500" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeImage();}}
              className="absolute top-2 right-2 bg-red-600/80 text-white p-1 w-7 h-7 flex items-center justify-center text-sm hover:bg-red-500 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
              disabled={isLoading}
              aria-label="Remove image"
            >
              &#x2715;
            </button>
          </div>
        )}
      </div>

      {inputError && <p role="alert" className="text-sm text-red-400 p-4 bg-red-900/20 border-l-3 border-red-500">{inputError}</p>}

      <div className="mt-6 flex items-center justify-start space-x-4 p-4 bg-slate-800/30 border-l-3 border-slate-600">
        <label htmlFor="advancedModeToggle" className="flex items-center cursor-pointer">
          <div className="relative">
            <input 
              type="checkbox" 
              id="advancedModeToggle" 
              className="sr-only" 
              checked={isAdvancedMode}
              onChange={() => setIsAdvancedMode(!isAdvancedMode)}
              disabled={isLoading}
            />
            <div className={`block w-12 h-6 transition-colors ${isAdvancedMode ? 'bg-sky-500' : 'bg-slate-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 transition-transform ${isAdvancedMode ? 'translate-x-6' : ''}`}></div>
          </div>
          <div className="ml-4 text-base font-medium text-slate-200">
            Advanced Mode
          </div>
        </label>
        <AcademicCapIcon className="h-6 w-6 text-sky-400" title="Advanced mode breaks down the problem into smaller steps to solve complex issues."/>
      </div>


      <button
        type="submit"
        disabled={isLoading || (!problemText.trim() && !imageBase64)}
        className="w-full flex items-center justify-center px-8 py-4 border-l-4 border-sky-500 text-lg font-medium text-white bg-sky-600/80 hover:bg-sky-500 hover:border-sky-400 focus:outline-none focus:border-sky-300 disabled:bg-slate-600/50 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-600 transition-all duration-200 group"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing{isAdvancedMode ? " (Advanced)..." : "..."}
          </>
        ) : (
          <>
            <SparklesIcon className="h-5 w-5 mr-2 group-hover:animate-pulse" />
            Solve Problem {isAdvancedMode && "(Advanced)"}
          </>
        )}
      </button>
    </form>
  );
};