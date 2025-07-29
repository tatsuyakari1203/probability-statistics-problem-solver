import * as React from 'react';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';

export const Footer: React.FC = () => {
  return (
    <footer className="text-center py-8">
      <div className="text-base-content/50 text-sm">
        <p>&copy; {new Date().getFullYear()} AI Problem Solver. Powered by Google Gemini.</p>
      </div>
    </footer>
  );
};