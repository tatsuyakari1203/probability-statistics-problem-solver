
import * as React from 'react';
import { useState, useCallback } from 'react';
import { ProblemInput } from './components/ProblemInput';
import { SolutionDisplay } from './components/SolutionDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { solveProblemWithGemini } from './services/geminiService';
import type { GeminiSolutionResponse, AdvancedModeProgress, ModelChoice } from './types';
import type { SubjectType } from './config/subjectConfig';
import { Layout } from './components/layout/Layout';
import { HeroSection } from './components/layout/HeroSection';

const App: React.FC = () => {
  const [solution, setSolution] = useState<GeminiSolutionResponse | null>(null);
  const [lastSolutionText, setLastSolutionText] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedModeProgress, setAdvancedModeProgress] = useState<AdvancedModeProgress | null>(null);

  const handleProgressUpdate = useCallback((progress: AdvancedModeProgress | null) => {
    setAdvancedModeProgress(progress);
  }, []);

  const handleSubmitProblem = useCallback(async (problemText: string, imageBase64: string | null, documentFile: File | null, isAdvancedMode: boolean, subjectType: SubjectType, modelChoice: ModelChoice) => {
    if (!problemText && !imageBase64 && !documentFile) {
      setError('Please enter a problem, upload an image, or provide a document.');
      return;
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
        documentFile,
        isAdvancedMode,
        handleProgressUpdate,
        subjectType,
        modelChoice
      );
      
      if (!result || typeof result !== 'object') {
        throw new Error('The AI returned an invalid response.');
      }
      
      setSolution(result);
      setLastSolutionText(JSON.stringify(result.solution));

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

      <div className="mb-12">
        <ProblemInput onSubmit={handleSubmitProblem} isLoading={isLoading} lastSolution={lastSolutionText} />
      </div>

      {isLoading && (
        <div className="animate-fade-in my-8">
          <LoadingSpinner advancedProgress={advancedModeProgress} />
        </div>
      )}
      {error && !isLoading && (
        <div className="animate-slide-in my-8">
          <ErrorMessage message={error} />
        </div>
      )}
      {solution && !error && !isLoading && (
        <div className="animate-fade-in my-8">
          <React.Suspense fallback={
            <div className="flex justify-center items-center p-8 sm:p-12">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="ml-4 text-base sm:text-lg text-gray-600">Đang tải kết quả...</span>
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