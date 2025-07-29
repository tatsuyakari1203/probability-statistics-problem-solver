
export type ModelChoice = 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';

export interface SolutionStep {
  explanation: string;
  verificationCode?: string;
}

export interface GeminiSolutionResponse {
  problemUnderstanding: {
    restatedProblem: string;
    keyInformation: string[];
    problemGoal: string;
    imageAcknowledgement: string;
  };
  solutionSteps: SolutionStep[];
  finalAnswer: string;
  detectedSubject?: string;
  subjectConfig?: {
    name: string;
    description: string;
  };
}

export interface AdvancedModeProgress {
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  phase?: 'planning' | 'generating_textual_solution' | 'complete';
}