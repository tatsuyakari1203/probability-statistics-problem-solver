
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
       <div className="mt-6 p-5 border-l-4 border-red-500 space-y-4 bg-red-900/20">
        <div className="flex justify-between items-center">
            <p className="text-base font-medium text-red-300 flex items-center">
                <InformationCircleIcon className="h-6 w-6 mr-2 flex-shrink-0" />
                Error executing step's JavaScript.
            </p>
            <CopyButton textToCopy={codeForDisplay} tooltipText="Copy original AI code" size="sm"/>
        </div>
        <div className="space-y-3 text-sm">
            <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider text-sm">Original Code:</span>
                <pre className="text-slate-300 bg-slate-800/50 border-l-3 border-slate-600 p-3 mt-2 overflow-x-auto text-sm"><code className="block">{codeForDisplay}</code></pre>
            </div>
             <div>
                <span className="text-slate-400 font-medium uppercase tracking-wider text-sm">Error details:</span>
                <p className="text-red-300 bg-slate-800/50 border-l-3 border-red-600 p-3 mt-2 whitespace-pre-wrap text-sm">{errorToDisplay}</p>
            </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`mt-6 p-5 space-y-4 ${isVerificationContext && errorToDisplay ? 'border-l-4 border-red-500 bg-red-900/20' : 'bg-slate-800/30'}`}>
      <div>
        <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
          <div className="flex items-center">
            <CodeBracketIcon className="h-5 w-5 mr-2 text-sky-400" />
            <span className="font-medium uppercase tracking-wider">JS Code{isVerificationContext ? " (Verification)" : " (Step)"}:</span>
          </div>
          <CopyButton textToCopy={codeForDisplay} size="sm"/>
        </div>
        <div className="prose prose-sm prose-invert max-w-none">
          <MarkdownViewer content={`\`\`\`javascript\n${codeForDisplay}\n\`\`\``} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-sm text-slate-400 mb-3">
            <div className="flex items-center">
                <CalculatorIcon className="h-5 w-5 mr-2 text-amber-400"/>
                <span className="font-medium uppercase tracking-wider">Code Result:</span>
            </div>
            <CopyButton textToCopy={displayResultText} size="sm" />
        </div>
        <pre className={`text-base bg-slate-800/50 border-l-3 border-amber-500 p-4 overflow-x-auto ${errorToDisplay ? 'text-red-300' : 'text-amber-300'}`}>
            <code>{displayResultText}</code>
        </pre>
         {isVerificationContext && errorToDisplay && (
            <p className="mt-3 text-sm text-red-300">Verification code execution failed. See error details above.</p>
        )}
      </div>
    </div>
  );
};

const ProblemUnderstandingDisplay: React.FC<{ understanding: ProblemUnderstanding }> = ({ understanding }) => {
  // Enhanced validation and error handling
  if (!understanding || typeof understanding !== 'object') {
    return (
      <div className="mb-12 pt-8 border-t border-slate-700/50">
        <div className="p-4 bg-red-900/20 border border-red-500 rounded-md">
          <p className="text-red-300">Problem understanding data is missing or invalid.</p>
        </div>
      </div>
    );
  }

  const keyInfoText = Array.isArray(understanding.keyInformation) 
    ? understanding.keyInformation.map(info => `- ${info}`).join('\n')
    : '';
  
  return (
    <div className="mb-12 pt-8 border-t border-slate-700/50">
      <div className="flex justify-between items-start mb-8 pb-6">
        <h2 className="text-3xl font-light text-sky-300 flex items-center animate-slide-in">
          <BrainIcon className="h-8 w-8 mr-3 text-sky-400" />
          Problem Analysis
        </h2>
      </div>
      <div className="space-y-6 text-sm">
        {(['restatedProblem', 'keyInformation', 'problemGoal', 'imageAcknowledgement'] as const).map(field => {
          let title = '';
          let content = '';
          let copyContent = '';

          switch(field) {
            case 'restatedProblem':
              title = 'Re-stated Problem:';
              content = understanding.restatedProblem || '';
              copyContent = understanding.restatedProblem || '';
              break;
            case 'keyInformation':
              title = 'Key Information Identified:';
              const keyInfo = Array.isArray(understanding.keyInformation) ? understanding.keyInformation : [];
              content = keyInfo.length > 0 ? keyInfo.map(info => `- ${info}`).join('\n') : "_No specific key information points listed by AI._";
              copyContent = keyInfoText;
              break;
            case 'problemGoal':
              title = 'Problem Goal:';
              content = understanding.problemGoal || '';
              copyContent = understanding.problemGoal || '';
              break;
            case 'imageAcknowledgement':
              title = 'Image Acknowledgement:';
              content = understanding.imageAcknowledgement || '';
              copyContent = understanding.imageAcknowledgement || '';
              break;
          }

          // Enhanced content validation
          if (!content || content.trim() === '' || (Array.isArray(content) && content.length === 0)) return null;

          return (
            <div key={field} className="p-5 bg-slate-800/30 border-l-3 border-slate-600 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-slate-100 text-lg">{title}</h4>
                <CopyButton textToCopy={copyContent} />
              </div>
              <div className="text-slate-300 prose prose-sm prose-invert max-w-none">
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
                <pre className="font-semibold text-lg text-amber-300 bg-slate-800 p-3 rounded-md overflow-x-auto">
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
  return (
    <div className="mt-12 p-6 animate-fade-in bg-slate-900/50 border-l-4 border-sky-400">
      {solution.problemUnderstanding && (
        <ProblemUnderstandingDisplay understanding={solution.problemUnderstanding} />
      )}

      {solution.sequentialSolution ? (
        <AdvancedModeSolutionDisplay solution={solution} />
      ) : (
        <NormalModeSolutionDisplay solution={solution} />
      )}
    </div>
  );
};