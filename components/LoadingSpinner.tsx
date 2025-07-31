

import * as React from 'react';
import type { AdvancedModeProgress } from '../types';

interface LoadingSpinnerProps {
  advancedProgress?: AdvancedModeProgress | null;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ advancedProgress }) => {
  const hasStreamedContent = advancedProgress && advancedProgress.streamedContent;

  return (
    <div className="border border-gray-200 rounded-lg p-8 w-full flex flex-col items-center justify-center bg-gray-50">
      <div className="w-16 h-16 mb-6 relative">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>

      <h3 className="text-lg font-medium text-gray-800 mb-2 text-center">
        {advancedProgress ? 'Processing in advanced mode...' : 'Analyzing your problem...'}
      </h3>
      <p className="text-gray-600 mb-6 text-center">
        Please wait a moment
      </p>

      {hasStreamedContent && (
        <div className="w-full max-w-3xl mt-6 text-left">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <div className="flex items-center mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="font-medium text-sm text-gray-300">AI's reasoning process:</span>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs text-gray-200">{advancedProgress.streamedContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
