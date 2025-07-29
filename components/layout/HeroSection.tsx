import * as React from 'react';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';

export const HeroSection: React.FC = () => {
  return (
    <div className="text-center py-12 md:py-16">
      <AcademicCapIcon className="h-12 w-12 text-primary mb-4 mx-auto" />
      <h1 className="text-4xl md:text-5xl font-bold mb-2">
        AI Problem Solver
      </h1>
      <p className="text-lg text-base-content/70">
        Solve math, physics, and chemistry problems with an intelligent AI.
      </p>
    </div>
  );
};