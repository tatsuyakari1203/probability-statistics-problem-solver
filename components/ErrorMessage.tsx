import React from 'react';
import { ExclamationTriangleIcon } from './icons/AlertIcons';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="alert alert-error mb-8">
      <ExclamationTriangleIcon className="h-6 w-6 flex-shrink-0" />
      <div>
        <h3 className="font-bold text-lg mb-1">
          Lỗi xử lý yêu cầu
        </h3>
        <div className="text-sm opacity-90">
          {message}
        </div>
        <div className="text-xs opacity-70 mt-2">
          Vui lòng thử lại hoặc kiểm tra dữ liệu đầu vào.
        </div>
      </div>
    </div>
  );
};