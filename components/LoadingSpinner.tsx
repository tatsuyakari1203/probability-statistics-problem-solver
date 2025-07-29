

import * as React from 'react';
import type { AdvancedModeProgress } from '../types';

interface LoadingSpinnerProps {
  advancedProgress?: AdvancedModeProgress | null;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ advancedProgress }) => {
  const hasStreamedContent = advancedProgress && advancedProgress.streamedContent;

  return (
    <div className="rounded-lg p-8 w-full flex flex-col items-center justify-center animate-pulse-bg border border-gray-200">
      <div className="w-16 h-16 mb-6">
        <svg className="w-full h-full" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
          <g fill="none" fillRule="evenodd">
            <g transform="translate(1 1)" strokeWidth="2">
              <circle strokeOpacity=".3" cx="18" cy="18" r="18" />
              <path d="M36 18c0-9.94-8.06-18-18-18">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 18 18"
                  to="360 18 18"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          </g>
        </svg>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-2">
        {advancedProgress ? 'Processing in Advanced Mode...' : 'Analyzing your problem...'}
      </h3>
      <p className="text-gray-600 mb-6">
        This may take a few moments
      </p>

      {hasStreamedContent && (
        <div className="w-full max-w-2xl mt-4 text-left">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 shadow-inner">
            <span className="font-semibold text-sm text-slate-300">Model's Reasoning Stream:</span>
            <div className="mt-2 bg-slate-900/70 rounded p-3 max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-200">{advancedProgress.streamedContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
