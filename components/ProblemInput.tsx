
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
    const newText = event.target.value;
    setProblemText(newText);
    
    // Clear error when user starts typing
    if (inputError && (newText.trim() || imageBase64)) setInputError(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      if (!isLoading && (problemText.trim() || imageBase64)) {
        const form = event.currentTarget.closest('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      }
    }
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
    <form onSubmit={handleSubmit}>
      <div className="card bg-base-200 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">
            <DocumentTextIcon className="h-8 w-8 text-primary" />
            Nhập bài toán của bạn
          </h2>
        
        {/* Problem Text Input */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text text-lg font-medium">Mô tả bài toán</span>
            <span className="label-text-alt text-sm opacity-70">
              {problemText.length}/10,000 ký tự
            </span>
          </label>
          <div className="relative w-full">
            <textarea
               value={problemText}
               onChange={handleTextChange}
               onKeyDown={handleKeyDown}
               placeholder="Ví dụ: Tính xác suất để trong 10 lần tung đồng xu, có ít nhất 7 lần xuất hiện mặt ngửa...&#10;&#10;Hoặc mô tả chi tiết bài toán xác suất và thống kê của bạn..."
               className={`textarea textarea-bordered textarea-lg min-h-[8rem] max-h-[20rem] resize-y transition-all duration-200 focus:textarea-primary w-full text-left ${
                 problemText.length > 9000 ? 'textarea-warning' : ''
               } ${
                 problemText.length > 9500 ? 'textarea-error' : ''
               }`}
               disabled={isLoading}
               style={{
                 height: Math.max(128, Math.min(320, problemText.split('\n').length * 24 + 64))
               }}
             />
            {problemText.trim() && (
              <button
                type="button"
                onClick={() => setProblemText('')}
                className="btn btn-ghost btn-xs absolute top-2 right-2 opacity-50 hover:opacity-100"
                disabled={isLoading}
                title="Xóa nội dung"
              >
                ✕
              </button>
            )}
          
          {/* Quick Templates */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <div className="dropdown dropdown-top">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-xs" disabled={isLoading}>
                  📝 Mẫu có sẵn
                </div>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-80 max-h-60 overflow-y-auto">
                  <li>
                    <a onClick={() => setProblemText('Tính xác suất để trong 10 lần tung đồng xu, có ít nhất 7 lần xuất hiện mặt ngửa.')}>
                      🪙 Xác suất tung đồng xu
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('Một hộp có 5 bi đỏ và 3 bi xanh. Lấy ngẫu nhiên 3 bi không hoàn lại. Tính xác suất để có đúng 2 bi đỏ.')}>
                      🔴 Bài toán bi màu
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('Điểm thi của một lớp tuân theo phân phối chuẩn với trung bình 75 và độ lệch chuẩn 10. Tính xác suất một học sinh có điểm từ 80 đến 90.')}>
                      📊 Phân phối chuẩn
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('Số khách hàng đến cửa hàng mỗi giờ tuân theo phân phối Poisson với λ = 5. Tính xác suất có đúng 3 khách hàng trong 1 giờ.')}>
                      🏪 Phân phối Poisson
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('Từ dữ liệu mẫu: [12, 15, 18, 20, 22, 25, 28, 30]. Tính trung bình, phương sai, độ lệch chuẩn và khoảng tin cậy 95%.')}>
                      📈 Thống kê mô tả
                    </a>
                  </li>
                </ul>
              </div>
              
              <div className="tooltip" data-tip="Ctrl+Enter để gửi">
                <kbd className="kbd kbd-xs">Ctrl</kbd>
                <span className="mx-1">+</span>
                <kbd className="kbd kbd-xs">Enter</kbd>
              </div>
            </div>
          </div>
          </div>
          {problemText.length > 8000 && (
            <div className="label">
              <span className={`label-text-alt text-xs ${
                problemText.length > 9500 ? 'text-error' : 
                problemText.length > 9000 ? 'text-warning' : 'text-info'
              }`}>
                {problemText.length > 9500 ? '⚠️ Gần đạt giới hạn ký tự' :
                 problemText.length > 9000 ? '💡 Nên rút gọn nội dung' :
                 '📝 Nội dung khá dài'}
              </span>
            </div>
          )}
        </div>

      {/* Image Upload Section */}
        <div className="form-control mt-6">
          <label className="label">
            <span className="label-text text-lg font-medium">Hoặc tải lên hình ảnh</span>
          </label>
          <div 
            ref={imageDropZoneRef} 
            className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation();}}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => !isLoading && fileInputRef.current?.click()}
          >
            <PhotoIcon className="mx-auto h-16 w-16 text-primary/60 mb-4" />
            <p className="text-lg font-medium mb-2">
              Kéo thả hoặc nhấp để chọn hình ảnh
            </p>
            <p className="text-sm opacity-60">
              (Tối đa {MAX_IMAGE_SIZE_MB}MB, định dạng JPG, PNG, WEBP)
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleImageChange}
              className="hidden"
              disabled={isLoading}
            />
          </div>
          
          <div className="mt-4 text-center">
            <div className="divider">HOẶC</div>
            <button
              type="button"
              onClick={handlePasteButtonClick}
              disabled={isLoading}
              className="btn btn-outline btn-sm"
            >
              <ClipboardIcon className="h-4 w-4 mr-2" />
              Dán từ clipboard (Ctrl+V)
            </button>
          </div>

          {previewUrl && (
            <div className="mt-6">
              <div className="relative inline-block">
                <img src={previewUrl} alt="Image preview" className="max-h-64 rounded-lg shadow-lg" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="btn btn-circle btn-sm btn-error absolute -top-2 -right-2"
                  disabled={isLoading}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {inputError && (
          <div className="alert alert-error mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{inputError}</span>
          </div>
        )}

        {/* Advanced Mode Toggle */}
        <div className="form-control mt-6">
          <label className="label cursor-pointer justify-start">
            <input 
              type="checkbox" 
              className="toggle toggle-primary mr-4" 
              checked={isAdvancedMode}
              onChange={() => setIsAdvancedMode(!isAdvancedMode)}
              disabled={isLoading}
            />
            <span className="label-text text-lg font-medium mr-2">Chế độ nâng cao</span>
            <AcademicCapIcon className="h-6 w-6 text-primary" title="Chế độ nâng cao chia nhỏ bài toán thành các bước để giải quyết vấn đề phức tạp."/>
          </label>
          <div className="label">
            <span className="label-text-alt opacity-70">Chia nhỏ bài toán thành các bước chi tiết</span>
          </div>
        </div>

        {/* Submit Button */}
         <div className="card-actions justify-end mt-8">
           <div className="w-full">
             <button
               type="submit"
               disabled={isLoading || (!problemText.trim() && !imageBase64)}
               className="btn btn-primary btn-lg w-full group"
             >
               {isLoading ? (
                 <>
                   <span className="loading loading-spinner loading-sm"></span>
                   Đang xử lý{isAdvancedMode ? " (Nâng cao)..." : "..."}
                 </>
               ) : (
                 <>
                   <SparklesIcon className="h-6 w-6 mr-2 group-hover:animate-pulse" />
                   Giải bài toán {isAdvancedMode && "(Nâng cao)"}
                   <kbd className="kbd kbd-xs ml-2 opacity-60">Ctrl+Enter</kbd>
                 </>
               )}
             </button>
             {(!problemText.trim() && !imageBase64) && (
               <div className="text-center mt-2">
                 <span className="text-xs opacity-60">💡 Nhập mô tả bài toán hoặc tải lên hình ảnh để bắt đầu</span>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   </form>
  );
};