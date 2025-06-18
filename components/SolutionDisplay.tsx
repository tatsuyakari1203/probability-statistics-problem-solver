
import React from 'react';
import type { GeminiSolutionResponse, ProblemUnderstanding, SequentialStepOutput } from '../types';
import { CheckCircleIcon, InformationCircleIcon, CodeBracketIcon, CalculatorIcon, BeakerIcon, BrainIcon, CogIcon } from './icons/SolutionIcons';
import { CopyButton } from './CopyButton';
import MarkdownViewer from './MarkdownViewer'; 

interface SolutionDisplayProps {
  solution: GeminiSolutionResponse;
}

const ExecuteJsCodeBlock: React.FC<{ code?: string, executionResult?: any, executionError?: string, isVerificationContext?: boolean }> = ({ 
    code, 
    executionResult, 
    executionError : externalError,
    isVerificationContext = false
}) => {
  // Enhanced validation with better type checking
  if (!code || typeof code !== 'string' || code.trim() === "") {
    if (isVerificationContext) {
        return (
          <div className="mt-3 p-3 border border-amber-600 rounded-md bg-amber-900/30">
            <p className="text-sm font-medium text-amber-300 flex items-center">
              <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
              AI did not provide executable verification code for the overall solution.
            </p>
          </div>
        );
    }
    return null;
  }

  const codeForDisplay = code;
  let resultToDisplay: any;
  let errorToDisplay: string | null = externalError || null;

  if (!errorToDisplay && executionResult !== undefined) {
    resultToDisplay = executionResult;
  } 
  else if (!errorToDisplay && executionResult === undefined && isVerificationContext) { 
    let codeToExecute = codeForDisplay;
    codeToExecute = codeToExecute.replace(/\$\$([\s\S]*?)\$\$/g, ''); 
    codeToExecute = codeToExecute.replace(/\$([^$]*?)\$/g, '');     
    codeToExecute = codeToExecute.replace(/\/\*[\s\S]*?\*\//g, ''); 
    codeToExecute = codeToExecute.replace(/\/\/.*$/gm, '');          
    codeToExecute = codeToExecute.trim();

    if (codeToExecute) {
        try {
            // eslint-disable-next-line no-new-func
            resultToDisplay = new Function(codeToExecute)();
        } catch (e) {
            errorToDisplay = e instanceof Error ? e.message : String(e);
            console.error("JavaScript code execution error (in ExecuteJsCodeBlock):", e, "\nOriginal AI Code:", codeForDisplay, "\nAttempted to execute:", codeToExecute);
        }
    } else {
        resultToDisplay = "No executable code found after cleaning.";
    }
  }

  // Enhanced result formatting with better error handling
  let displayResultText: string;
  if (errorToDisplay) {
      displayResultText = `Error: ${errorToDisplay}`;
  } else if (typeof resultToDisplay === 'number') {
    // Handle special number cases
    if (!isFinite(resultToDisplay)) {
        displayResultText = resultToDisplay.toString(); // Infinity, -Infinity, NaN
    } else if (Number.isInteger(resultToDisplay)) {
        displayResultText = resultToDisplay.toString();
    } else {
        let numStr = resultToDisplay.toFixed(10);
        if (numStr.includes('.')) {
            numStr = numStr.replace(/0+$/, ''); 
            if (numStr.endsWith('.')) {         
                numStr = numStr.slice(0, -1);
            }
        }
        displayResultText = numStr;
    }
  } else if (typeof resultToDisplay === 'boolean') {
    displayResultText = resultToDisplay.toString();
  } else if (typeof resultToDisplay === 'object' && resultToDisplay !== null) {
    try {
      // Handle circular references and other JSON.stringify issues
      displayResultText = JSON.stringify(resultToDisplay, (key, value) => {
        if (typeof value === 'function') return '[Function]';
        if (typeof value === 'symbol') return '[Symbol]';
        if (typeof value === 'bigint') return value.toString() + 'n';
        return value;
      }, 2);
    } catch (stringifyError) {
      displayResultText = `[Could not stringify object: ${stringifyError instanceof Error ? stringifyError.message : 'Unknown error'}]`;
    }
  } else if (resultToDisplay === null) {
    displayResultText = "null";
  } else if (resultToDisplay === undefined) {
    if (isVerificationContext) {
        displayResultText = "undefined (AI's verification code might not return an explicit value, or it's a block of non-returning statements. It should use 'return ...;')";
    } else {
        displayResultText = "undefined (This step's code might not return an explicit value.)";
    }
  } else {
    // Handle other types like string, symbol, bigint, etc.
    try {
      displayResultText = String(resultToDisplay);
    } catch (conversionError) {
      displayResultText = `[Could not convert to string: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}]`;
    }
  }

  if (errorToDisplay && !isVerificationContext) { 
    return (
       <div className="alert alert-error mt-4">
        <div className="flex flex-col w-full">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                    <InformationCircleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
                    <span className="font-semibold">JavaScript Execution Error</span>
                </div>
                <CopyButton textToCopy={codeForDisplay} tooltipText="Copy original AI code" size="sm"/>
            </div>
            <div className="space-y-3">
                <div>
                    <div className="text-sm font-medium mb-2">Original Code:</div>
                    <div className="mockup-code text-xs">
                        <pre className="overflow-x-auto pr-0"><code>{codeForDisplay}</code></pre>
                    </div>
                </div>
                 <div>
                    <div className="text-sm font-medium mb-2">Error Details:</div>
                    <div className="bg-base-200 p-3 rounded text-sm whitespace-pre-wrap">{errorToDisplay}</div>
                </div>
            </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`card bg-base-200 mt-4 ${isVerificationContext && errorToDisplay ? 'border border-error' : ''}`}>
      <div className="card-body p-4 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center text-sm font-medium">
              <CodeBracketIcon className="h-5 w-5 mr-2 text-primary" />
              <span>JS Code{isVerificationContext ? " (Verification)" : " (Step)"}:</span>
            </div>
            <CopyButton textToCopy={codeForDisplay} size="sm"/>
          </div>
          <div className="mockup-code text-sm">
            <MarkdownViewer content={`\`\`\`javascript\n${codeForDisplay}\n\`\`\``} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-sm font-medium">
                  <CalculatorIcon className="h-5 w-5 mr-2 text-warning"/>
                  <span>Result:</span>
              </div>
              <CopyButton textToCopy={displayResultText} size="sm" />
          </div>
          <div className={`mockup-code ${errorToDisplay ? 'text-error' : 'text-success'}`}>
              <pre className="overflow-x-auto pr-0"><code>{displayResultText}</code></pre>
          </div>
           {isVerificationContext && errorToDisplay && (
              <div className="alert alert-warning mt-3">
                <span className="text-sm">Verification code execution failed. See error details above.</span>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProblemUnderstandingDisplay: React.FC<{ understanding: ProblemUnderstanding }> = ({ understanding }) => {
  // Enhanced validation and error handling
  if (!understanding || typeof understanding !== 'object') {
    return (
      <div className="mb-8">
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Problem analysis data is missing or invalid.</span>
        </div>
      </div>
    );
  }

  const keyInfoText = Array.isArray(understanding.keyInformation) 
    ? understanding.keyInformation.map(info => `- ${info}`).join('\n')
    : '';
  
  return (
    <div className="pt-8 border-t border-slate-700/50">
      <div className="flex items-center mb-8 pb-6">
        <BrainIcon className="h-8 w-8 mr-3 text-blue-400 flex-shrink-0" />
        <h2 className="text-3xl font-light text-sky-300">
          Problem Analysis
        </h2>
      </div>
      <div className="space-y-6">
        {(['restatedProblem', 'keyInformation', 'problemGoal', 'imageAcknowledgement'] as const).map((field, index) => {
          let title = '';
          let content = '';
          let copyContent = '';

          switch(field) {
            case 'restatedProblem':
              title = 'Re-stated Problem';
              content = understanding.restatedProblem || '';
              copyContent = understanding.restatedProblem || '';
              break;
            case 'keyInformation':
              title = 'Key Information Identified';
              const keyInfo = Array.isArray(understanding.keyInformation) ? understanding.keyInformation : [];
              content = keyInfo.length > 0 ? keyInfo.map(info => `- ${info}`).join('\n') : "_No specific key information points listed by AI._";
              copyContent = keyInfoText;
              break;
            case 'problemGoal':
              title = 'Problem Goal';
              content = understanding.problemGoal || '';
              copyContent = understanding.problemGoal || '';
              break;
            case 'imageAcknowledgement':
              title = 'Image Acknowledgement';
              content = understanding.imageAcknowledgement || '';
              copyContent = understanding.imageAcknowledgement || '';
              break;
          }

          // Enhanced content validation
          if (!content || content.trim() === '' || (Array.isArray(content) && content.length === 0)) return null;

          return (
            <div key={field} className="p-6 bg-slate-800/20 border-l-3 border-blue-400 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-medium text-blue-300">{title}</h3>
                <CopyButton textToCopy={copyContent} tooltipText={`Copy ${title}`} />
              </div>
              <div className="text-slate-300 leading-relaxed prose prose-sm prose-invert max-w-none">
                <MarkdownViewer content={content} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NormalModeSolutionDisplay: React.FC<{ solution: GeminiSolutionResponse }> = ({ solution }) => (
  <div className="pt-8 border-t border-slate-700/50">
    <div className="flex items-center mb-8 pb-6">
      <CheckCircleIcon className="h-8 w-8 mr-3 text-green-400 flex-shrink-0" />
      <h2 className="text-3xl font-light text-sky-300">
          Solution Steps
        </h2>
    </div>
    <div className="space-y-6"> {/* Increased spacing between steps */}
      {(solution.solutionSteps || []).map((step, index) => (
        <div key={`normal-step-${index}`} className="p-6 bg-slate-800/20 border-l-3 border-teal-400 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium text-teal-300">Step {index + 1}</h3>
            <CopyButton textToCopy={step.explanation} tooltipText={`Copy Step ${index + 1} explanation`} />
          </div>
          <div className="text-slate-300 leading-relaxed prose prose-sm prose-invert max-w-none">
            <MarkdownViewer content={step.explanation} />
          </div>
        </div>
      ))}
    </div>
    {solution.finalAnswer && (
      <div className="mt-10 pt-6 border-t border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xl font-semibold text-sky-300 flex items-center">
            <InformationCircleIcon className="h-6 w-6 mr-2 text-sky-400" />
            Final Answer (from textual solution):
          </h3>
          <CopyButton textToCopy={solution.finalAnswer} />
        </div>
        <div className="p-6 bg-green-900/20 border-l-4 border-green-400 mt-4">
             <div className="text-xl text-green-300 font-medium prose prose-invert max-w-none">
               <MarkdownViewer content={solution.finalAnswer} />
             </div>
        </div>
      </div>
    )}
    {(solution.verificationCode && solution.verificationCode.trim() !== "") && (
      <div className="mt-10 pt-6 border-t border-slate-700">
         <div className="mb-3 pb-3 border-b border-slate-700">
            <h3 className="text-xl font-semibold text-sky-300 flex items-center">
                <BeakerIcon className="h-6 w-6 mr-2 text-purple-400" />
                Solution Verification Code & Result
            </h3>
        </div>
        <ExecuteJsCodeBlock code={solution.verificationCode} isVerificationContext={true} />
      </div>
    )}
  </div>
);

const AdvancedModeSolutionDisplay: React.FC<{ solution: GeminiSolutionResponse }> = ({ solution }) => {
  const sequentialSolution = solution.sequentialSolution;
  
  // Enhanced validation for sequential solution
  if (!sequentialSolution || typeof sequentialSolution !== 'object') {
    return (
      <div className="p-4 border border-red-500 rounded-md bg-red-900/30">
        <p className="text-red-400">Advanced mode solution data is missing or corrupted.</p>
      </div>
    );
  }
  
  if (!Array.isArray(sequentialSolution.steps) || sequentialSolution.steps.length === 0) {
    return (
      <div className="p-4 border border-amber-500 rounded-md bg-amber-900/30">
        <p className="text-amber-300">No sequential steps found in advanced mode solution.</p>
      </div>
    );
  }

  return (
    <div className="pt-8 border-t border-slate-700/50">
      <div className="flex items-center mb-8 pb-6">
        <CogIcon className="h-8 w-8 mr-3 text-cyan-400 flex-shrink-0 animate-pulse-subtle" />
        <h2 className="text-3xl font-light text-sky-300">
          Advanced Sequential Analysis
        </h2>
      </div>
      <div className="space-y-6"> {/* Increased spacing between steps */}
        {sequentialSolution.steps.map((step, index) => (
          <div key={`advanced-step-${index}`} className="p-6 bg-slate-800/20 border-l-3 border-cyan-400 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium text-cyan-300">
              Step {index + 1}
            </h3>
            <CopyButton textToCopy={step.stepExplanation} tooltipText={`Copy Step ${index + 1} explanation`} />
          </div>
            <div className="text-slate-300 leading-relaxed prose prose-sm prose-invert max-w-none mb-3">
              <MarkdownViewer content={step.stepExplanation} />
            </div>
            {(step.stepJsCode) && (
              <ExecuteJsCodeBlock 
                code={step.stepJsCode} 
                executionResult={step.stepJsCodeResult} 
                executionError={step.stepJsCodeError}
                isVerificationContext={false} 
              />
            )}
          </div>
        ))}
      </div>

      {(sequentialSolution.finalSummaryText || sequentialSolution.finalComputedAnswer !== undefined) && (
        <div className="mt-10 pt-8 border-t-2 border-slate-700">
          <div className="mb-4 pb-4 border-b border-slate-700">
            <h3 className="text-xl font-semibold text-sky-300 flex items-center">
                <InformationCircleIcon className="h-7 w-7 mr-2.5 text-sky-400" />
                Final Conclusion (from Sequential Process):
            </h3>
          </div>
          {sequentialSolution.finalSummaryText && (
            <div className="mb-5 p-4 rounded-md"> {/* Removed border */}
                <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm text-slate-300 font-medium">AI's Textual Summary:</p>
                    <CopyButton textToCopy={sequentialSolution.finalSummaryText} />
                </div>
                <div className="text-md text-green-300 prose prose-invert max-w-none">
                  <MarkdownViewer content={sequentialSolution.finalSummaryText} />
                </div>
            </div>
          )}
          {sequentialSolution.finalComputedAnswer !== undefined && (
             <div className="mt-4 p-4 rounded-md"> {/* Removed border */}
                <div className="flex justify-between items-center mb-1.5">
                    <p className="text-sm text-slate-300 font-medium">Final Computed Answer (from last step):</p>
                    <CopyButton textToCopy={String(sequentialSolution.finalComputedAnswer)} />
                </div>
                <pre className="font-semibold text-lg text-amber-300 bg-slate-800 p-3 rounded-md overflow-x-auto pr-0">
                    <code>
                    {typeof sequentialSolution.finalComputedAnswer === 'object' 
                        ? JSON.stringify(sequentialSolution.finalComputedAnswer, null, 2) 
                        : String(sequentialSolution.finalComputedAnswer)}
                    </code>
                </pre>
            </div>
          )}
        </div>
      )}

      {sequentialSolution.finalConclusion && (
        <div className="mt-10 pt-8 border-t border-slate-700/50">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-medium text-green-300 flex items-center">
              <CheckCircleIcon className="h-7 w-7 mr-3 text-green-400" />
              Final Conclusion
            </h3>
            <CopyButton textToCopy={sequentialSolution.finalConclusion} />
          </div>
          <div className="p-6 bg-green-900/20 border-l-4 border-green-400">
            <div className="text-xl text-green-300 font-medium prose prose-invert max-w-none">
              <MarkdownViewer content={sequentialSolution.finalConclusion} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ solution }) => {
  // Enhanced validation with better error handling
  if (!solution || typeof solution !== 'object') {
    return (
      <div className="alert alert-error mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Solution data is missing or invalid.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {solution.problemUnderstanding && (
        <ProblemUnderstandingDisplay understanding={solution.problemUnderstanding} />
      )}
      
      {/* Check for Advanced Mode (sequential solution) */}
      {solution.sequentialSolution && solution.sequentialSolution.steps && solution.sequentialSolution.steps.length > 0 ? (
        <AdvancedModeSolutionDisplay solution={solution} />
      ) : (
        /* Normal Mode - show solution steps */
        <NormalModeSolutionDisplay solution={solution} />
      )}
    </div>
  );
};