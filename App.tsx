
import React, { useState, useCallback } from 'react';
import { ProblemInput } from './components/ProblemInput';
import { SolutionDisplay } from './components/SolutionDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { solveProblemWithGemini } from './services/geminiService';
import type { GeminiSolutionResponse, AdvancedModeProgress } from './types';
import { AcademicCapIcon } from './components/icons/AcademicCapIcon';

const App: React.FC = () => {
  const [solution, setSolution] = useState<GeminiSolutionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [advancedModeProgress, setAdvancedModeProgress] = useState<AdvancedModeProgress | null>(null);

  const handleProgressUpdate = useCallback((progress: AdvancedModeProgress | null) => {
    setAdvancedModeProgress(progress);
  }, []);

  const handleSubmitProblem = useCallback(async (problemText: string, imageBase64: string | null, isAdvancedMode: boolean) => {
    // Enhanced input validation
    if (!problemText || typeof problemText !== 'string' || problemText.trim() === '') {
      if (!imageBase64) {
        setError('Vui lòng nhập mô tả bài toán hoặc tải lên hình ảnh.');
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
        handleProgressUpdate
      );
      
      // Enhanced result validation
      if (!result || typeof result !== 'object') {
        throw new Error('AI trả về dữ liệu không hợp lệ.');
      }
      
      setSolution(result);

    } catch (err) {
      // Enhanced error handling with more specific error messages
      let errorMessage = 'Đã xảy ra lỗi không xác định.';
      
      if (err instanceof Error) {
        if (err.message.includes("Could not parse response from AI")) {
          errorMessage = "AI đã trả về một phản hồi không hợp lệ và không thể hiển thị. Đây có thể là một lỗi tạm thời, vui lòng thử lại sau.";
        } else if (err.message.includes("API Key")) {
          errorMessage = "Khóa API chưa được cấu hình. Vui lòng kiểm tra cài đặt.";
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          errorMessage = "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.";
        } else if (err.message.includes("timeout")) {
          errorMessage = "Yêu cầu đã hết thời gian chờ. Vui lòng thử lại sau.";
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
    <div className="container mx-auto p-6 animate-fade-in">
      <header className="mb-12 text-center">
        <div className="flex items-center justify-center mb-6 animate-slide-in">
          <AcademicCapIcon className="h-14 w-14 text-sky-400 mr-4 animate-pulse-subtle" />
          <h1 className="text-5xl font-light tracking-wide text-sky-400">
            Probability & Statistics Solver
          </h1>
        </div>
        <p className="text-slate-300 text-xl font-light max-w-2xl mx-auto leading-relaxed">
          Enter your problem or upload an image to get a detailed solution
        </p>
      </header>

      <ProblemInput onSubmit={handleSubmitProblem} isLoading={isLoading} />

      {isLoading && <LoadingSpinner advancedProgress={advancedModeProgress} />}
      {error && !isLoading && <ErrorMessage message={error} />}
      {solution && !error && !isLoading && (
        <React.Suspense fallback={
          <div className="flex justify-center items-center p-8">
            <div className="text-slate-400">Đang tải kết quả...</div>
          </div>
        }>
          <SolutionDisplay solution={solution} />
        </React.Suspense>
      )}


      <footer className="mt-20 text-center text-slate-400 border-t border-slate-800 pt-8">
        <p className="text-sm font-light">&copy; {new Date().getFullYear()} AI Solver. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

export default App;