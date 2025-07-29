
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES, GEMINI_MODELS } from '../constants';
import { PhotoIcon, DocumentTextIcon, SparklesIcon, ClipboardIcon, AcademicCapIcon } from './icons/InputIcons';
import { SubjectType, SUBJECTS } from '../config/subjectConfig';
import type { ModelChoice } from '../types';

const QUICK_START_TEMPLATES = [
  { label: '🪙 Coin Toss', text: 'Calculate the probability that in 10 coin tosses, there are at least 7 heads.' },
  { label: '🔴 Ball Problem', text: 'A box contains 5 red and 3 blue balls. 3 balls are drawn randomly without replacement. Calculate the probability of getting exactly 2 red balls.' },
  { label: '📊 Normal Distribution', text: 'The test scores of a class follow a normal distribution with a mean of 75 and a standard deviation of 10. Calculate the probability that a student scores between 80 and 90.' },
  { label: '🎯 Confidence Interval', text: 'A sample of 50 students has a mean score of 82 with a standard deviation of 8. Calculate the 95% confidence interval for the true mean score of the population.' },
  { label: '🎲 Bayes\' Theorem', text: 'A test for a disease is 99% accurate for people who have it and 95% accurate for people who don\'t. If 1% of the population has the disease, what is the probability that a person who tests positive actually has it?' },
  { label: '📈 Linear Regression', text: 'Given the data points (1, 2), (2, 3), (3, 5), (4, 7), find the equation of the linear regression line.' },
  { label: '⚖️ Balance Equation', text: 'Balance the chemical equation: C₂H₆ + O₂ → CO₂ + H₂O' },
  { label: '🔬 Stoichiometry', text: 'How many grams of water (H₂O) are produced from the combustion of 10 grams of methane (CH₄) with excess oxygen (O₂)? The reaction is CH₄ + 2O₂ → CO₂ + 2H₂O.' },
  { label: '🧪 Calculate pH', text: 'Calculate the pH of a 0.01M HCl solution.' },
  { label: '📈 Derivative', text: 'Find the derivative of the function f(x) = x³ + 2x² - 5x + 1' },
  { label: '🚗 Kinematics', text: 'A car accelerates from rest to 60 mph in 5 seconds. What is its acceleration and how far did it travel?' },
];

interface ProblemInputProps {
  onSubmit: (problemText: string, imageBase64: string | null, isAdvancedMode: boolean, subjectType: SubjectType, modelChoice: ModelChoice) => void;
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
  const [modelChoice, setModelChoice] = useState<ModelChoice>('gemini-2.5-flash');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageDropZoneRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback((file: File): boolean => {
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
    onSubmit(trimmedText, imageBase64, isAdvancedMode, selectedSubject, modelChoice);
  }, [problemText, imageBase64, onSubmit, isAdvancedMode, selectedSubject, modelChoice]);

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
      <div className="w-full">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-3" />
            Enter Your Problem
          </h2>
        
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text text-base font-semibold text-gray-700">Problem Description</span>
            <span className="label-text-alt text-xs text-gray-500">
              {problemText.length}/10,000
            </span>
          </label>
          <div className="relative w-full">
             <textarea
                value={problemText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Example: Calculate the probability that in 10 coin tosses, there are at least 7 heads...&#10;&#10;Or describe your probability and statistics problem in detail..."
                className={`w-full p-4 bg-gray-50 border border-gray-300 rounded-md text-base text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 min-h-[8rem] max-h-[20rem] resize-y ${
                  problemText.length > 9000 ? 'border-yellow-400 focus:ring-yellow-400' : ''
                } ${
                  problemText.length > 9500 ? 'border-red-500 focus:ring-red-500' : ''
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
                className="btn btn-ghost btn-xs absolute top-3 right-3 opacity-50 hover:opacity-100"
                disabled={isLoading}
                title="Clear content"
              >
                ✕
              </button>
            )}
          
          <div className="mt-4">
            <label className="label-text text-sm font-medium text-gray-600 mb-2 block">
              Or try a quick start template:
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_START_TEMPLATES.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setProblemText(template.text)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200 disabled:opacity-50"
                  disabled={isLoading}
                  title={template.text}
                >
                  {template.label}
                </button>
              ))}
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

        <div className="form-control mt-6">
          <label className="label">
            <span className="label-text text-base font-semibold text-gray-700">Or upload an image</span>
          </label>
          <div
            ref={imageDropZoneRef}
            className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-gray-50"
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
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-base font-medium text-gray-700 mb-2">
              Drag & drop or click to select an image
            </p>
            <p className="text-xs text-gray-500">
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
              className="btn btn-ghost btn-sm"
            >
              <ClipboardIcon className="h-4 w-4 mr-2" />
              Paste from clipboard
            </button>
          </div>

          {previewUrl && (
            <div className="mt-6">
              <div className="relative inline-block">
                <img src={previewUrl} alt="Image preview" className="max-h-64 rounded-lg shadow-md border border-gray-200" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="btn btn-circle btn-xs bg-red-500 hover:bg-red-600 text-white border-none absolute -top-2 -right-2"
                  disabled={isLoading}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {inputError && (
          <div role="alert" className="alert alert-error mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{inputError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Subject Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-semibold text-gray-700">Select Subject</span>
              </label>
              <select
                className="w-full mt-2 p-3 bg-gray-50 border border-gray-300 rounded-md text-base text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
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

            {/* Model Selection */}
            <div className="form-control">
              <label className="label">
                <span className="label-text text-base font-semibold text-gray-700">Select Model</span>
              </label>
              <select
                className="w-full mt-2 p-3 bg-gray-50 border border-gray-300 rounded-md text-base text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200"
                value={modelChoice}
                onChange={(e) => setModelChoice(e.target.value as ModelChoice)}
                disabled={isLoading}
              >
                {Object.entries(GEMINI_MODELS).map(([key, model]) => (
                  <option key={key} value={key}>
                    {model.name}
                  </option>
                ))}
              </select>
              <div className="label">
                <span className="label-text-alt opacity-70">
                  {GEMINI_MODELS[modelChoice].description}
                </span>
              </div>
            </div>
        </div>

        <div className="form-control mt-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="advanced-mode"
                name="advanced-mode"
                type="checkbox"
                className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                checked={isAdvancedMode}
                onChange={() => setIsAdvancedMode(!isAdvancedMode)}
                disabled={isLoading}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="advanced-mode" className="font-medium text-gray-800 flex items-center">
                Advanced Mode (Code Execution)
                <AcademicCapIcon className="h-5 w-5 text-indigo-600 ml-2" title="Advanced mode uses Code Execution to solve complex problems."/>
              </label>
              <p className="text-xs text-gray-500">Uses Gemini's Code Execution for higher accuracy on complex problems.</p>
            </div>
          </div>
        </div>

         <div className="mt-8">
           <div className="w-full">
             <button
               type="submit"
               disabled={isLoading || (!problemText.trim() && !imageBase64)}
               className="w-full inline-flex justify-center items-center px-6 py-4 border border-transparent text-lg font-semibold rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed group transition-colors"
             >
               {isLoading ? (
                 <>
                   <span className="loading loading-spinner loading-sm"></span>
                   Processing{isAdvancedMode ? " (Advanced)..." : "..."}
                 </>
               ) : (
                 <>
                   <SparklesIcon className="h-6 w-6 mr-2" />
                   Solve Problem {isAdvancedMode && "(Advanced)"}
                 </>
               )}
             </button>
             {(!problemText.trim() && !imageBase64) && (
               <div className="text-center mt-2">
                 <span className="text-xs text-gray-500">💡 Enter a problem or upload an image to start</span>
               </div>
             )}
           </div>
         </div>
        </div>
      </div>
   </form>
  );
};