import * as React from 'react';
import { ExclamationTriangleIcon } from './icons/AlertIcons';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div role="alert" className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-lg">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-2 text-red-900">
            An Error Occurred
          </h3>
          <div className="text-sm text-red-700 leading-relaxed mb-3">
            {message}
          </div>
          <div className="text-xs text-red-600/80">
            Please try again or check your input data.
          </div>
        </div>
      </div>
    </div>
  );
};