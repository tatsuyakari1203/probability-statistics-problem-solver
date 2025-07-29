
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from '../constants';
import { PhotoIcon, DocumentTextIcon, SparklesIcon, ClipboardIcon, AcademicCapIcon } from './icons/InputIcons';
import { SubjectType, SUBJECTS } from '../config/subjectConfig';

interface ProblemInputProps {
  onSubmit: (problemText: string, imageBase64: string | null, isAdvancedMode: boolean, subjectType?: SubjectType) => void;
  isLoading: boolean;
}

export const ProblemInput: React.FC<ProblemInputProps> = ({ onSubmit, isLoading }) => {
  const [problemText, setProblemText] = useState<string>('');
  const [problemImage, setProblemImage] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('probability_statistics');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDropZoneRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback((file: File): boolean => {
    // Enhanced file validation
    if (!file || !(file instanceof File)) {
      setInputError('Invalid file.');
      return false;
    }

    if (file.size === 0) {
      setInputError('Empty file. Please select another file.');
      return false;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setInputError(`Image size cannot exceed ${MAX_IMAGE_SIZE_MB}MB.`);
      setProblemImage(null);
      setImageBase64(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return false;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setInputError('Unsupported image format. Please select JPG, PNG, or WEBP.');
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
          throw new Error('Invalid file reading result.');
        }
      } catch (error) {
        setInputError('Error processing image file.');
        setProblemImage(null);
        setImageBase64(null);
        setPreviewUrl(null);
      }
    };
    reader.onerror = () => {
        setInputError('Could not read image file.');
        setProblemImage(null);
        setImageBase64(null);
        setPreviewUrl(null);
    }
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      setInputError('Error reading image file.');
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
      setInputError('Please enter a problem description or upload/paste an image.');
      return;
    }
    
    if (trimmedText.length > 10000) {
      setInputError('Problem description is too long. Please shorten it to under 10,000 characters.');
      return;
    }
    
    setInputError(null);
    onSubmit(trimmedText, imageBase64, isAdvancedMode, selectedSubject);
  }, [problemText, imageBase64, onSubmit, isAdvancedMode, selectedSubject]);

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
    const pasteHandler = (event: ClipboardEvent) => handleDirectPaste(event);
    if (dropZone) {
      dropZone.addEventListener('paste', pasteHandler);
      return () => {
        dropZone.removeEventListener('paste', pasteHandler);
      };
    }
  }, [handleDirectPaste]);


  return (
    <form onSubmit={handleSubmit}>
      <div className="card bg-base-200 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">
            <DocumentTextIcon className="h-8 w-8 text-primary" />
            Enter Your Problem
          </h2>
        
        {/* Problem Text Input */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text text-lg font-medium">Problem Description</span>
            <span className="label-text-alt text-sm opacity-70">
              {problemText.length}/10,000 characters
            </span>
          </label>
          <div className="relative w-full">
            <textarea
               value={problemText}
               onChange={handleTextChange}
               onKeyDown={handleKeyDown}
               placeholder="Example: Calculate the probability that in 10 coin tosses, there are at least 7 heads...&#10;&#10;Or describe your probability and statistics problem in detail..."
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
                title="Clear content"
              >
                ✕
              </button>
            )}
          
          {/* Quick Templates */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <div className="dropdown dropdown-bottom">
                <button type="button" tabIndex={0} className="btn btn-ghost btn-xs" disabled={isLoading}>
                  📝 Templates
                </button>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-80 max-h-60 overflow-y-auto">
                  {/* Xác suất & Thống kê */}
                  {/* Probability & Statistics */}
                  <li className="menu-title"><span>📊 Probability & Statistics</span></li>
                  <li>
                    <a onClick={() => setProblemText('Calculate the probability that in 10 coin tosses, there are at least 7 heads.')}>
                      🪙 Coin Toss Probability
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('A box contains 5 red and 3 blue balls. 3 balls are drawn randomly without replacement. Calculate the probability of getting exactly 2 red balls.')}>
                      🔴 Colored Ball Problem
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('The test scores of a class follow a normal distribution with a mean of 75 and a standard deviation of 10. Calculate the probability that a student scores between 80 and 90.')}>
                      📊 Normal Distribution
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('The number of customers arriving at a store per hour follows a Poisson distribution with λ = 5. Calculate the probability of exactly 3 customers in 1 hour.')}>
                      🏪 Poisson Distribution
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('From the sample data: [12, 15, 18, 20, 22, 25, 28, 30]. Calculate the mean, variance, standard deviation, and 95% confidence interval.')}>
                      📈 Descriptive Statistics
                    </a>
                  </li>
                  
                  {/* Physics */}
                  <li className="menu-title"><span>⚛️ Physics</span></li>
                  <li>
                    <a onClick={() => setProblemText('An object with a mass of 2kg is moving at a velocity of 10m/s. Calculate its kinetic energy.')}>
                      🏃 Kinetic Energy
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('A charge q = 2μC is placed in a uniform electric field E = 1000V/m. Calculate the force on the charge.')}>
                      ⚡ Electric Field
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('A spring with a stiffness of k = 100N/m is compressed by 5cm. Calculate the elastic potential energy of the spring.')}>
                      🌀 Elastic Potential Energy
                    </a>
                  </li>
                  
                  {/* Chemistry */}
                  <li className="menu-title"><span>🧪 Chemistry</span></li>
                  <li>
                    <a onClick={() => setProblemText('Balance the chemical equation: C₂H₆ + O₂ → CO₂ + H₂O')}>
                      ⚖️ Balance Equation
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('Calculate the pH of a 0.01M HCl solution.')}>
                      🧪 Calculate pH
                    </a>
                  </li>
                  
                  {/* General Math */}
                  <li className="menu-title"><span>📐 General Math</span></li>
                  <li>
                    <a onClick={() => setProblemText('Find the derivative of the function f(x) = x³ + 2x² - 5x + 1')}>
                      📈 Derivative
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('Solve the system of equations: 2x + 3y = 7; x - y = 1')}>
                      🔢 System of Equations
                    </a>
                  </li>
                  <li>
                    <a onClick={() => setProblemText('Calculate the integral: ∫(x² + 3x + 2)dx from 0 to 2')}>
                      ∫ Integral
                    </a>
                  </li>
                </ul>
              </div>
              
              <div className="tooltip" data-tip="Ctrl+Enter to submit">
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
                {problemText.length > 9500 ? '⚠️ Approaching character limit' :
                 problemText.length > 9000 ? '💡 Consider shortening content' :
                 '📝 Content is quite long'}
              </span>
            </div>
          )}
        </div>

      {/* Image Upload Section */}
        <div className="form-control mt-6">
          <label className="label">
            <span className="label-text text-lg font-medium">Or upload an image</span>
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
              Drag & drop or click to select an image
            </p>
            <p className="text-sm opacity-60">
              (Max {MAX_IMAGE_SIZE_MB}MB, JPG, PNG, or WEBP)
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
            <div className="divider">OR</div>
            <button
              type="button"
              onClick={handlePasteButtonClick}
              disabled={isLoading}
              className="btn btn-outline btn-sm"
            >
              <ClipboardIcon className="h-4 w-4 mr-2" />
              Paste from clipboard (Ctrl+V)
            </button>
          </div>

          {previewUrl && (
            <div className="mt-6">
              <div className="relative inline-block">
                <img src={previewUrl} alt="Image preview" className="max-h-64 rounded-lg shadow-md" />
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

        {/* Subject Selection */}
        <div className="form-control mt-6">
          <label className="label">
            <span className="label-text text-lg font-medium">Select Subject</span>
          </label>
          <select 
            className="select select-bordered w-full" 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value as SubjectType)}
            disabled={isLoading}
          >
            {Object.entries(SUBJECTS).map(([key, subject]) => (
              <option key={key} value={key}>
                {subject.name}
              </option>
            ))}
          </select>
          <div className="label">
            <span className="label-text-alt opacity-70">
              {SUBJECTS[selectedSubject].description}
            </span>
          </div>
        </div>

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
            <span className="label-text text-lg font-medium mr-2">Advanced Mode</span>
            <AcademicCapIcon className="h-6 w-6 text-primary" title="Advanced mode breaks down the problem into steps to solve complex issues."/>
          </label>
          <div className="label">
            <span className="label-text-alt opacity-70">Breaks down the problem into detailed steps</span>
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
                   Processing{isAdvancedMode ? " (Advanced)..." : "..."}
                 </>
               ) : (
                 <>
                   <SparklesIcon className="h-6 w-6 mr-2 group-hover:animate-pulse" />
                   Solve Problem {isAdvancedMode && "(Advanced)"}
                   <kbd className="kbd kbd-xs ml-2 opacity-60">Ctrl+Enter</kbd>
                 </>
               )}
             </button>
             {(!problemText.trim() && !imageBase64) && (
               <div className="text-center mt-2">
                 <span className="text-xs opacity-60">💡 Enter a problem or upload an image to start</span>
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   </form>
  );
};