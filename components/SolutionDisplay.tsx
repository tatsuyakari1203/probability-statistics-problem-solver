import * as React from 'react';
import type { GeminiSolutionResponse, SolutionStep } from '../types';
import { CheckCircleIcon, InformationCircleIcon, CodeBracketIcon, CalculatorIcon, BeakerIcon, BrainIcon } from './icons/SolutionIcons';
import { CopyButton } from './CopyButton';
import MarkdownViewer from './MarkdownViewer';

interface SolutionDisplayProps {
  solution: GeminiSolutionResponse;
}

const VerificationCodeBlock: React.FC<{ code?: string }> = ({ code }) => {
  if (!code || typeof code !== 'string' || code.trim() === "") {
    return null;
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="p-0">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm font-semibold text-gray-700">
              <CodeBracketIcon className="h-5 w-5 mr-2 text-indigo-600" />
              <span>Verification Code</span>
            </div>
            <CopyButton textToCopy={code} size="sm"/>
          </div>
          <div className="bg-gray-50 p-2 rounded-md">
            <MarkdownViewer content={`\`\`\`python\n${code}\n\`\`\``} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProblemUnderstandingDisplay: React.FC<{ understanding: GeminiSolutionResponse['problemUnderstanding'] }> = ({ understanding }) => {
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

const SolutionStepsDisplay: React.FC<{ solution: GeminiSolutionResponse }> = ({ solution }) => (
  <div className="pt-8 mt-8 border-t border-gray-200">
    <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center tracking-tight">
      <CheckCircleIcon className="h-7 w-7 mr-3 text-green-500" />
      Solution Steps
    </h2>
    <div className="space-y-4">
      {(solution.solutionSteps || []).map((step: SolutionStep, index: number) => (
        <div key={`step-${index}`} className="py-4 border-b border-gray-200 last:border-b-0">
          <div className="p-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Step {index + 1}</h3>
              <CopyButton textToCopy={step.explanation} tooltipText={`Copy Step ${index + 1} explanation`} />
            </div>
            <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
              <MarkdownViewer content={step.explanation} />
            </div>
            <VerificationCodeBlock code={step.verificationCode} />
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
  </div>
);

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
      <SolutionStepsDisplay solution={solution} />
    </div>
  );
};