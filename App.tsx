
import * as React from 'react';
import { useState, useCallback } from 'react';
import { ProblemInput } from './components/ProblemInput';
import { SolutionDisplay } from './components/SolutionDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { solveProblemWithGemini } from './services/geminiService';
import type { GeminiSolutionResponse, AdvancedModeProgress } from './types';
import type { SubjectType } from './config/subjectConfig';
import { Layout } from './components/layout/Layout';
import { HeroSection } from './components/layout/HeroSection';

const App: React.FC = () => {
  const [solution, setSolution] = useState<GeminiSolutionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedModeProgress, setAdvancedModeProgress] = useState<AdvancedModeProgress | null>(null);

  const handleProgressUpdate = useCallback((progress: AdvancedModeProgress | null) => {
    setAdvancedModeProgress(progress);
  }, []);

  const handleSubmitProblem = useCallback(async (problemText: string, imageBase64: string | null, isAdvancedMode: boolean, subjectType?: SubjectType) => {
    // Enhanced input validation
    if (!problemText || typeof problemText !== 'string' || problemText.trim() === '') {
      if (!imageBase64) {
        setError('Please enter a problem description or upload an image.');
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setSolution(null);
    setAdvancedModeProgress(null);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API Key is not configured. Please set the API_KEY environment variable.");
      }
      
      const result = await solveProblemWithGemini(
        problemText,
        imageBase64,
        isAdvancedMode,
        handleProgressUpdate,
        subjectType
      );
      
      // Enhanced result validation
      if (!result || typeof result !== 'object') {
        throw new Error('The AI returned an invalid response.');
      }
      
      setSolution(result);

    } catch (err) {
      // Enhanced error handling with more specific error messages
      let errorMessage = 'An unknown error occurred.';
      
      if (err instanceof Error) {
        if (err.message.includes("Could not parse response from AI")) {
          errorMessage = "The AI returned a response that could not be displayed. This might be a temporary issue, please try again.";
        } else if (err.message.includes("API Key")) {
          errorMessage = "The API Key is not configured. Please check your settings.";
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          errorMessage = "A network error occurred. Please check your internet connection and try again.";
        } else if (err.message.includes("timeout")) {
          errorMessage = "The request timed out. Please try again later.";
        } else {
          errorMessage = err.message;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      console.error("Error solving problem:", err);
      setSolution(null);
    } finally {
      setIsLoading(false);
      setAdvancedModeProgress(null);
    }
  }, [handleProgressUpdate]);

  return (
    <Layout>
      <HeroSection />

      <div className="problem-input-container">
        <ProblemInput onSubmit={handleSubmitProblem} isLoading={isLoading} />
      </div>

      {isLoading && (
        <div className="loading-container animate-slide-in">
          <LoadingSpinner advancedProgress={advancedModeProgress} />
        </div>
      )}
      {error && !isLoading && (
        <div className="error-container animate-slide-in">
          <ErrorMessage message={error} />
        </div>
      )}
      {solution && !error && !isLoading && (
        <div className="solution-display-container animate-fade-in">
          <React.Suspense fallback={
            <div className="flex justify-center items-center p-8 sm:p-12">
              <div className="loading loading-spinner loading-lg text-primary animate-glow"></div>
              <span className="ml-4 text-base sm:text-lg text-base-content/70">Loading results...</span>
            </div>
          }>
            <SolutionDisplay solution={solution} />
          </React.Suspense>
        </div>
      )}
    </Layout>
  );
};

export default App;