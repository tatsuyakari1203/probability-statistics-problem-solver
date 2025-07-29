import * as React from 'react';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';

export const HeroSection: React.FC = () => {
  return (
    <div className="text-center pt-12 pb-16">
      <AcademicCapIcon className="h-12 w-12 text-indigo-600 mb-4 mx-auto" />
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
        AI Problem Solver
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Solve math, physics, and chemistry problems with an intelligent AI.
      </p>
    </div>
  );
};