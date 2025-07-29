import * as React from 'react';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="text-center py-10 mt-16 border-t border-gray-200">
      <div className="text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Problem Solver. Powered by Google Gemini.</p>
      </div>
    </footer>
  );
};