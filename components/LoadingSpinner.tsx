

import * as React from 'react';
import type { AdvancedModeProgress } from '../types';

interface LoadingSpinnerProps {
  advancedProgress?: AdvancedModeProgress | null;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ advancedProgress }) => {
  const hasAdvancedProgress = advancedProgress && advancedProgress.totalSteps > 0;

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
        {hasAdvancedProgress ? 'Processing in Advanced Mode...' : 'Analyzing your problem...'}
      </h3>
      <p className="text-gray-600 mb-6">
        This may take a few moments
      </p>

      {hasAdvancedProgress && (
        <div className="w-full max-w-md mt-4">
          <div className="bg-white/60 rounded-lg p-4 border border-gray-200/80 shadow-inner">
            <div className="space-y-3">
              <div className="flex justify-between items-center font-medium">
                <span className="text-indigo-700">
                  Step: {advancedProgress.currentStep} / {advancedProgress.totalSteps}
                </span>
              </div>
              <div className="w-full bg-gray-200/70 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(advancedProgress.currentStep / advancedProgress.totalSteps) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-700 text-center pt-1">
                {advancedProgress.stepDescription}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
