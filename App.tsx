
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
    <div className="min-h-screen bg-base-100">
      <div className="w-full max-w-none px-0 py-4 sm:py-6 lg:py-8">
        {/* Simplified Hero Section */}
        <div className="hero min-h-[30vh] rounded-2xl mb-8 mx-auto max-w-6xl animate-fade-in">
          <div className="hero-content text-center">
            <div className="max-w-3xl">
              <AcademicCapIcon className="h-12 w-12 text-white mb-4 mx-auto" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                Probability & Statistics Solver
              </h1>
              <p className="text-sm sm:text-base text-blue-100 opacity-80">
                Giải bài toán xác suất thống kê với AI
              </p>
            </div>
          </div>
        </div>

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
                <span className="ml-4 text-base sm:text-lg text-base-content/70 loading-shimmer">Đang tải kết quả...</span>
              </div>
            }>
              <SolutionDisplay solution={solution} />
            </React.Suspense>
          </div>
        )}

        <footer className="mt-16 sm:mt-20 lg:mt-24 text-center pt-8 sm:pt-12 mx-2 sm:mx-4 animate-fade-in">
          <div className="bg-gradient-to-r from-transparent via-base-300/50 to-transparent h-px mb-8"></div>
          <div className="text-base-content/60 space-y-4">
            <div className="flex justify-center items-center space-x-4">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-primary/50"></div>
              <AcademicCapIcon className="h-6 w-6 text-primary/70" />
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-primary/50"></div>
            </div>
            <p className="text-sm sm:text-base font-medium bg-gradient-to-r from-base-content/60 to-primary/80 bg-clip-text text-transparent">
              &copy; {new Date().getFullYear()} AI Probability & Statistics Solver
            </p>
            <p className="text-xs sm:text-sm text-base-content/40">
              Powered by Google Gemini AI • Made with ❤️ for Education
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;