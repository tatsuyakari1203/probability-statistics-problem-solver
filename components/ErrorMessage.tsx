import * as React from 'react';
import { ExclamationTriangleIcon } from './icons/AlertIcons';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div role="alert" className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg shadow-md">
      <div className="flex">
        <div className="py-1">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-4" />
        </div>
        <div>
          <h3 className="font-bold text-lg mb-1">
            Error Processing Request
          </h3>
          <div className="text-sm">
            {message}
          </div>
          <div className="text-xs opacity-80 mt-2">
            Please try again or check your input data.
          </div>
        </div>
      </div>
    </div>
  );
};