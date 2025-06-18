import React from 'react';
import { ExclamationTriangleIcon } from './icons/AlertIcons';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="my-8 p-6 flex items-start text-red-300 bg-red-900/20 border-l-4 border-red-500 animate-fade-in" role="alert">
      <ExclamationTriangleIcon className="h-7 w-7 mr-4 flex-shrink-0 text-red-400" />
      <div>
        <h3 className="font-medium text-red-200 text-lg mb-2">Error Occurred</h3>
        <p className="text-base leading-relaxed">{message}</p>
      </div>
    </div>
  );
};