
import React, { useState, useCallback } from 'react';
import { ProblemInput } from './components/ProblemInput';
import { SolutionDisplay } from './components/SolutionDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { solveProblemWithGemini } from './services/geminiService';
import type { GeminiSolutionResponse, AdvancedModeProgress } from './types';
import type { SubjectType } from './config/subjectConfig';
import { AcademicCapIcon } from './components/icons/AcademicCapIcon';

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
        handleProgressUpdate,
        subjectType
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
        {/* Enhanced Hero Section */}
        <div className="hero min-h-[35vh] rounded-2xl mb-8 mx-auto max-w-6xl animate-fade-in bg-gradient-to-br from-primary/90 via-secondary/80 to-accent/70 backdrop-blur-sm">
          <div className="hero-content text-center">
            <div className="max-w-4xl">
              <AcademicCapIcon className="h-16 w-16 text-white mb-6 mx-auto animate-float" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                AI Multi-Subject Problem Solver
              </h1>
              <p className="text-lg sm:text-xl text-blue-50 opacity-90 mb-6 font-medium">
                Giải bài toán Toán học, Vật lý, Hóa học với AI thông minh
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                <div className="badge badge-lg bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  📊 Xác suất & Thống kê
                </div>
                <div className="badge badge-lg bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  🧮 Đại số tuyến tính
                </div>
                <div className="badge badge-lg bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  📐 Giải tích
                </div>
                <div className="badge badge-lg bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  ⚛️ Vật lý
                </div>
                <div className="badge badge-lg bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  🧪 Hóa học
                </div>
              </div>
              <p className="text-sm sm:text-base text-blue-100/80">
                Hỗ trợ nhập văn bản, tải ảnh và giải thích chi tiết từng bước
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
              &copy; {new Date().getFullYear()} AI Multi-Subject Problem Solver
            </p>
            <div className="flex justify-center items-center gap-4 text-xs sm:text-sm text-base-content/40 flex-wrap">
              <span>🤖 Powered by Google Gemini AI</span>
              <span>•</span>
              <span>📚 Hỗ trợ đa môn học</span>
              <span>•</span>
              <span>❤️ Made for Education</span>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <div className="badge badge-ghost badge-sm">📊 Toán học</div>
              <div className="badge badge-ghost badge-sm">⚛️ Vật lý</div>
              <div className="badge badge-ghost badge-sm">🧪 Hóa học</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;