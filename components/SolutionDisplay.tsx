import * as React from 'react';
import type { GeminiSolutionResponse, SolutionStep } from '../types';
import { CheckCircleIcon, InformationCircleIcon, CodeBracketIcon, CalculatorIcon, BrainIcon } from './icons/SolutionIcons';
import { CopyButton } from './CopyButton';
import MarkdownViewer from './MarkdownViewer';

interface SolutionDisplayProps {
  solution: GeminiSolutionResponse;
}

const CodeBlock: React.FC<{ code?: string }> = ({ code }) => {
  if (!code) return null;
  return (
    <div className="my-4">
      <div className="flex items-center justify-between mb-2 text-sm font-semibold text-gray-700">
        <div className="flex items-center">
          <CodeBracketIcon className="h-5 w-5 mr-2 text-indigo-600" />
          <span>Code</span>
        </div>
        <CopyButton textToCopy={code} size="sm"/>
      </div>
      <MarkdownViewer content={`\`\`\`python\n${code}\n\`\`\``} />
    </div>
  );
};

const ProblemAnalysisDisplay: React.FC<{ analysis: GeminiSolutionResponse['problemAnalysis'] }> = ({ analysis }) => {
  if (!analysis) return null;
  return (
    <div className="pt-8">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center tracking-tight">
        <BrainIcon className="h-7 w-7 mr-3 text-indigo-600" />
        Problem Analysis
      </h2>
      <div className="space-y-4">
        <MarkdownViewer content={analysis.restatedProblem} />
        <MarkdownViewer content={analysis.keyInformation.join('\n')} />
        <MarkdownViewer content={analysis.problemGoal} />
      </div>
    </div>
  );
};

const SolutionStepsDisplay: React.FC<{ steps: SolutionStep[] }> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="pt-8 mt-8 border-t border-gray-200">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center tracking-tight">
        <CheckCircleIcon className="h-7 w-7 mr-3 text-green-500" />
        Solution Steps
      </h2>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="py-4 border-b border-gray-200 last:border-b-0">
            <MarkdownViewer content={step.explanation} />
            <CodeBlock code={step.code} />
          </div>
        ))}
      </div>
    </div>
  );
};

const FinalAnswerDisplay: React.FC<{ answer?: string }> = ({ answer }) => {
  if (!answer) return null;
  return (
    <div className="mt-10 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
        <InformationCircleIcon className="h-6 w-6 mr-3 text-indigo-600" />
        Final Answer
      </h3>
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
        <div className="prose prose-sm max-w-none text-indigo-900">
          <MarkdownViewer content={answer} />
        </div>
      </div>
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
      <ProblemAnalysisDisplay analysis={solution.problemAnalysis} />
      <SolutionStepsDisplay steps={solution.solution} />
      <FinalAnswerDisplay answer={solution.finalAnswer} />
    </div>
  );
};