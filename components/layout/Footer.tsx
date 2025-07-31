import * as React from 'react';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 py-12 mt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <AcademicCapIcon className="h-4 w-4 text-gray-700" />
          </div>
          <p className="text-gray-600 mb-2">
            © 2024 AI Problem Solver. Được phát triển với ❤️ cho giáo dục.
          </p>
          <p className="text-sm text-gray-500">
            Giải pháp AI tiên tiến cho giáo dục
          </p>
        </div>
      </div>
    </footer>
  );
};