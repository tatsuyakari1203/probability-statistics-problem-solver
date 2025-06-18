

import React from 'react';
import type { AdvancedModeProgress } from '../types';

interface LoadingSpinnerProps {
  advancedProgress?: AdvancedModeProgress | null;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ advancedProgress }) => {
  return (
    <div className="card bg-base-200 shadow-xl mb-8">
      <div className="card-body items-center text-center">
        <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
        
        <h3 className="card-title text-xl mb-2">
          {advancedProgress && advancedProgress.totalSteps > 0 ? 'Đang xử lý chế độ nâng cao...' : 'Đang phân tích bài toán của bạn...'}
        </h3>
        <p className="text-base-content/70 mb-4">
          Quá trình này có thể mất vài phút
        </p>
        
        {advancedProgress && advancedProgress.totalSteps > 0 && (
          <div className="w-full max-w-md">
            <div className="bg-base-300 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-primary">
                    Bước hiện tại: {advancedProgress.currentStep}
                  </span>
                  <span className="text-sm opacity-70">
                    {advancedProgress.currentStep} / {advancedProgress.totalSteps}
                  </span>
                </div>
                <p className="text-sm opacity-80 text-left">
                  {advancedProgress.stepDescription}
                </p>
                <div className="w-full">
                  <progress 
                    className="progress progress-primary w-full" 
                    value={advancedProgress.currentStep} 
                    max={advancedProgress.totalSteps}
                  ></progress>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
