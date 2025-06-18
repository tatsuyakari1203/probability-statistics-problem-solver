

import React from 'react';
import type { AdvancedModeProgress } from '../types';

interface LoadingSpinnerProps {
  advancedProgress?: AdvancedModeProgress | null;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ advancedProgress }) => {
  let displayMessage = 'Finding solution, please wait...';
  let subMessage = 'AI is working on your problem.';

  if (advancedProgress) {
    displayMessage = "Processing..."; 
    subMessage = "AI is thinking...";

    switch (advancedProgress.phase) {
      case 'understanding_problem':
        displayMessage = "Analyzing Problem...";
        subMessage = "AI is carefully reviewing your problem statement and any images.";
        break;
      case 'planning':
        displayMessage = "Advanced Mode: Generating Solution Plan...";
        subMessage = "AI is breaking down the problem into manageable steps.";
        break;
      case 'sequential_solving':
        displayMessage = `Advanced Mode: Step ${advancedProgress.currentStep}`;
        // totalSteps is 0 for sequential mode, so no /total part.
        subMessage = `Current task: ${advancedProgress.stepDescription || 'Working on the next part...'}`;
        break;
      case 'generating_textual_solution':
        if (advancedProgress.totalSteps > 0 && advancedProgress.currentStep > 0) { // Should not happen with current service logic, but kept for robustness
             displayMessage = `Advanced Mode: Step ${advancedProgress.currentStep}/${advancedProgress.totalSteps}`;
             subMessage = `Generating textual solution for: ${advancedProgress.stepDescription}`;
        } else { // Normal mode context for textual solution
            displayMessage = "Generating Textual Solution...";
            subMessage = "AI is preparing the detailed explanation.";
        }
        break;
      // Removed 'solving_steps' case as it's covered by 'sequential_solving' for advanced mode iteration
      // and 'generating_textual_solution' for normal mode textual generation.
      case 'generating_verification_code':
        let baseVerificationMessage = "Textual Solution Complete.";
        // This check might be redundant if advanced mode doesn't hit this phase with totalSteps directly.
        // if (advancedProgress.totalSteps > 0) { 
        //     baseVerificationMessage = `Advanced Mode: All ${advancedProgress.totalSteps} Textual Solution Steps Complete.`;
        // }
        displayMessage = baseVerificationMessage;
        subMessage = "Generating final verification code for the entire solution...";
        break;
      case 'complete': 
        displayMessage = "Processing Complete";
        subMessage = "Finalizing solution.";
        break;
    }
  }


  return (
    <div className="flex flex-col items-center justify-center my-12 p-8 bg-slate-900/40 border-l-4 border-sky-400 animate-fade-in">
      <svg className="animate-spin h-12 w-12 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-xl text-slate-300 font-medium text-center animate-slide-in">
        {displayMessage}
      </p>
      <p className="mt-2 text-base text-slate-400 text-center max-w-md">{subMessage}</p>
    </div>
  );
};
