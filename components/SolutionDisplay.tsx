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
    <div className="my-6">
      <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-700 border-b border-gray-600">
          <div className="flex items-center">
            <CodeBracketIcon className="h-4 w-4 mr-2 text-indigo-400" />
            <span className="text-sm font-medium text-gray-300">Code</span>
          </div>
          <CopyButton textToCopy={code} size="sm"/>
        </div>
        <div className="p-4">
          <MarkdownViewer content={`\`\`\`python\n${code}\n\`\`\``} />
        </div>
      </div>
    </div>
  );
};

const ProblemAnalysisDisplay: React.FC<{ analysis: GeminiSolutionResponse['problemAnalysis'] }> = ({ analysis }) => {
  if (!analysis) return null;
  return (
    <div className="pt-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center mr-3">
            <BrainIcon className="h-4 w-4 text-blue-600" />
          </div>
          Phân tích bài toán
        </h2>
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <MarkdownViewer content={analysis.restatedProblem} />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <MarkdownViewer content={analysis.keyInformation.join('\n')} />
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <MarkdownViewer content={analysis.problemGoal} />
          </div>
        </div>
      </div>
    </div>
  );
};

const SolutionStepsDisplay: React.FC<{ steps: SolutionStep[] }> = ({ steps }) => {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="pt-8 mt-8">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center mr-3">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
          </div>
          Các bước giải
        </h2>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-4">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-semibold mr-3">
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-gray-600">Bước {index + 1}</span>
              </div>
              <MarkdownViewer content={step.explanation} />
              <CodeBlock code={step.code} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FinalAnswerDisplay: React.FC<{ answer?: string }> = ({ answer }) => {
  if (!answer) return null;
  return (
    <div className="mt-10 pt-8">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center mr-3">
            <InformationCircleIcon className="h-4 w-4 text-orange-600" />
          </div>
          Đáp án cuối cùng
        </h3>
        <div className="bg-white border border-gray-200 p-4 rounded-lg">
          <div className="prose max-w-none text-gray-800">
            <MarkdownViewer content={answer} />
          </div>
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