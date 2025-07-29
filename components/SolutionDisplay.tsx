import * as React from 'react';
import type { GeminiSolutionResponse, ProblemUnderstanding, SequentialStepOutput, SolutionStep } from '../types';
import { CheckCircleIcon, InformationCircleIcon, CodeBracketIcon, CalculatorIcon, BeakerIcon, BrainIcon, CogIcon } from './icons/SolutionIcons';
import { CopyButton } from './CopyButton';
import MarkdownViewer from './MarkdownViewer';

interface SolutionDisplayProps {
  solution: GeminiSolutionResponse;
}

const ExecuteJsCodeBlock: React.FC<{ code?: string, executionResult?: any, executionError?: string, isVerificationContext?: boolean }> = ({
    code,
    executionResult,
    executionError: externalError,
    isVerificationContext = false
}) => {
  if (!code || typeof code !== 'string' || code.trim() === "") {
    if (isVerificationContext) {
        return (
          <div className="alert alert-warning mt-3">
            <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>The AI did not provide executable verification code.</span>
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
    let codeToExecute = codeForDisplay.replace(/\$\$([\s\S]*?)\$\$/g, '').replace(/\$([^$]*?)\$/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
    if (codeToExecute) {
        try {
            resultToDisplay = new Function(codeToExecute)();
        } catch (e) {
            errorToDisplay = e instanceof Error ? e.message : String(e);
        }
    } else {
        resultToDisplay = "No executable code found after cleaning.";
    }
  }

  let displayResultText: string;
  if (errorToDisplay) {
      displayResultText = `Error: ${errorToDisplay}`;
  } else if (typeof resultToDisplay === 'number') {
    if (!isFinite(resultToDisplay)) {
        displayResultText = resultToDisplay.toString();
    } else {
        displayResultText = Number(resultToDisplay.toFixed(10)).toString();
    }
  } else if (resultToDisplay === undefined) {
    displayResultText = "undefined";
  } else {
    try {
      displayResultText = JSON.stringify(resultToDisplay, null, 2);
    } catch {
      displayResultText = String(resultToDisplay);
    }
  }

  if (errorToDisplay && !isVerificationContext) {
    return (
       <div className="alert alert-error mt-4">
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">JavaScript Execution Error</span>
                <CopyButton textToCopy={codeForDisplay} tooltipText="Copy original AI code" size="sm"/>
            </div>
            <div className="text-sm font-medium mb-1">Original Code:</div>
            <div className="mockup-code text-xs"><pre><code>{codeForDisplay}</code></pre></div>
            <div className="text-sm font-medium mt-2 mb-1">Error:</div>
            <div className="bg-base-200 p-2 rounded text-sm">{errorToDisplay}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-4 border-t border-gray-200 pt-4 ${isVerificationContext && errorToDisplay ? 'border-l-4 border-red-500 pl-4' : ''}`}>
      <div className="p-0">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm font-semibold text-gray-700">
              <CodeBracketIcon className="h-5 w-5 mr-2 text-indigo-600" />
              <span>JS Code{isVerificationContext ? " (Verification)" : ""}</span>
            </div>
            <CopyButton textToCopy={codeForDisplay} size="sm"/>
          </div>
          <div className="bg-gray-50 p-2 rounded-md">
            <MarkdownViewer content={`\`\`\`javascript\n${codeForDisplay}\n\`\`\``} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
              <div className="flex items-center text-sm font-semibold text-gray-700">
                  <CalculatorIcon className="h-5 w-5 mr-2 text-indigo-600"/>
                  <span>Result</span>
              </div>
              <CopyButton textToCopy={displayResultText} size="sm" />
          </div>
          <div className={`bg-gray-50 p-3 rounded-md text-sm ${errorToDisplay ? 'text-red-600' : 'text-green-600'}`}>
              <pre className="whitespace-pre-wrap"><code>{displayResultText}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProblemUnderstandingDisplay: React.FC<{ understanding: ProblemUnderstanding }> = ({ understanding }) => {
  if (!understanding) return null;

  const keyInfoText = Array.isArray(understanding.keyInformation) ? understanding.keyInformation.map(info => `- ${info}`).join('\n') : '';

  return (
    <div className="pt-8">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center tracking-tight">
        <BrainIcon className="h-7 w-7 mr-3 text-indigo-600" />
        Problem Analysis
      </h2>
      <div className="space-y-4">
        {(['restatedProblem', 'keyInformation', 'problemGoal', 'imageAcknowledgement'] as const).map((field) => {
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
              title = 'Key Information';
              content = keyInfoText;
              copyContent = keyInfoText;
              break;
            case 'problemGoal':
              title = 'Goal';
              content = understanding.problemGoal || '';
              copyContent = understanding.problemGoal || '';
              break;
            case 'imageAcknowledgement':
              title = 'Image Analysis';
              content = understanding.imageAcknowledgement || '';
              copyContent = understanding.imageAcknowledgement || '';
              break;
          }

          if (!content.trim()) return null;

          return (
            <div key={field} className="py-4 border-b border-gray-200 last:border-b-0">
              <div className="p-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                  <CopyButton textToCopy={copyContent} tooltipText={`Copy ${title}`} />
                </div>
                <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                  <MarkdownViewer content={content} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const NormalModeSolutionDisplay: React.FC<{ solution: GeminiSolutionResponse }> = ({ solution }) => (
  <div className="pt-8 mt-8 border-t border-gray-200">
    <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center tracking-tight">
      <CheckCircleIcon className="h-7 w-7 mr-3 text-green-500" />
      Solution Steps
    </h2>
    <div className="space-y-4">
      {(solution.solutionSteps || []).map((step: SolutionStep, index: number) => (
        <div key={`normal-step-${index}`} className="py-4 border-b border-gray-200 last:border-b-0">
          <div className="p-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Step {index + 1}</h3>
              <CopyButton textToCopy={step.explanation} tooltipText={`Copy Step ${index + 1} explanation`} />
            </div>
            <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
              <MarkdownViewer content={step.explanation} />
            </div>
          </div>
        </div>
      ))}
    </div>
    {solution.finalAnswer && (
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <InformationCircleIcon className="h-6 w-6 mr-3 text-indigo-600" />
          Final Answer
        </h3>
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
          <div className="prose prose-sm max-w-none text-indigo-900">
            <MarkdownViewer content={solution.finalAnswer} />
          </div>
        </div>
      </div>
    )}
    {(solution.verificationCode && solution.verificationCode.trim() !== "") && (
      <div className="mt-10 pt-8 border-t border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <BeakerIcon className="h-6 w-6 mr-3 text-indigo-600" />
            Solution Verification
        </h3>
        <ExecuteJsCodeBlock code={solution.verificationCode} isVerificationContext={true} />
      </div>
    )}
  </div>
);

const AdvancedModeSolutionDisplay: React.FC<{ solution: GeminiSolutionResponse }> = ({ solution }) => {
  const sequentialSolution = solution.sequentialSolution;

  if (!sequentialSolution || !Array.isArray(sequentialSolution.steps) || sequentialSolution.steps.length === 0) {
    return (
      <div className="alert alert-warning mt-4">
        <span>No sequential steps were found in the advanced mode solution.</span>
      </div>
    );
  }

  return (
    <div className="pt-8 mt-8 border-t border-gray-200">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center tracking-tight">
        <CogIcon className="h-7 w-7 mr-3 text-indigo-600" />
        Advanced Sequential Analysis
      </h2>
      <div className="space-y-4">
        {sequentialSolution.steps.map((step: SequentialStepOutput, index: number) => (
          <div key={`advanced-step-${index}`} className="py-4 border-b border-gray-200 last:border-b-0">
            <div className="p-0">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Step {index + 1}</h3>
                <CopyButton textToCopy={step.stepExplanation} tooltipText={`Copy Step ${index + 1} explanation`} />
              </div>
              <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none mb-4">
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
          </div>
        ))}
      </div>

      {(sequentialSolution.finalSummaryText || sequentialSolution.finalComputedAnswer !== undefined) && (
        <div className="mt-10 pt-8 border-t border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <InformationCircleIcon className="h-6 w-6 mr-3 text-indigo-600" />
              Final Conclusion
          </h3>
          {sequentialSolution.finalSummaryText && (
            <div className="mb-4">
                <p className="text-base font-semibold text-gray-700 mb-2">AI's Textual Summary:</p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <div className="prose prose-sm max-w-none text-blue-900">
                    <MarkdownViewer content={sequentialSolution.finalSummaryText} />
                  </div>
                </div>
            </div>
          )}
          {sequentialSolution.finalComputedAnswer !== undefined && (
             <div className="mt-4">
                <p className="text-base font-semibold text-gray-700 mb-2">Final Computed Answer:</p>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre className="whitespace-pre-wrap"><code>
                    {typeof sequentialSolution.finalComputedAnswer === 'object'
                        ? JSON.stringify(sequentialSolution.finalComputedAnswer, null, 2)
                        : String(sequentialSolution.finalComputedAnswer)}
                  </code></pre>
                </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ solution }) => {
  if (!solution) {
    return (
      <div className="alert alert-error mb-8">
        <span>Solution data is missing or invalid.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {solution.problemUnderstanding && (
        <ProblemUnderstandingDisplay understanding={solution.problemUnderstanding} />
      )}

      {solution.sequentialSolution && solution.sequentialSolution.steps && solution.sequentialSolution.steps.length > 0 ? (
        <AdvancedModeSolutionDisplay solution={solution} />
      ) : (
        <NormalModeSolutionDisplay solution={solution} />
      )}
    </div>
  );
};