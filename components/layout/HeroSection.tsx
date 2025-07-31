import * as React from 'react';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';

export const HeroSection: React.FC = () => {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-8">
        <AcademicCapIcon className="h-6 w-6 text-gray-700" />
      </div>
      <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-6">
        Probability & Statistics Problem Solver
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
        An advanced AI tool to help you solve probability and statistics problems with detailed and easy-to-understand solutions.
      </p>
    </div>
  );
};