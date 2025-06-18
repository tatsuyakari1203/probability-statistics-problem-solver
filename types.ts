
export interface SolutionStep { // For Normal Mode's textual solution steps
  explanation: string;
}

export interface ProblemUnderstanding {
  restatedProblem: string;
  keyInformation: string[];
  problemGoal: string;
  imageAcknowledgement: string;
}

// For Advanced Mode (Sequential Thinking)
export interface SequentialStepOutput {
  stepExplanation: string;
  stepJsCode?: string;      // Optional JS code for this specific step
  stepJsCodeResult?: any; // Result of executing stepJsCode
  stepJsCodeError?: string; // Error message if execution failed
  // isThisTheFinalStep is determined by the AI's response and drives the loop, not necessarily stored here
  // focusForNextStep is an instruction for the AI, not necessarily stored here
}

// Represents the structure of the solution
export interface GeminiSolutionResponse {
  problemUnderstanding?: ProblemUnderstanding;

  // Fields for Normal Mode
  solutionSteps?: SolutionStep[]; 
  finalAnswer?: string; // Textual final answer for normal mode        
  verificationCode?: string; // Single verification code for normal mode

  // Fields for Advanced Mode (Sequential Thinking)
  sequentialSolution?: {
    steps: SequentialStepOutput[];
    finalComputedAnswer?: any; // Computed result from the AI's final sequential step's jsCode
    finalSummaryText?: string;  // Textual summary from the AI's final sequential step's explanation
  };
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  retrievedContext?: {
    uri:string;
    title: string;
  };
}

// AI response structure for a single sequential step in Advanced Mode
export interface AISequentialStepResponse {
  stepExplanation: string;
  stepJsCode?: string;
  isThisTheFinalStep: boolean;
  focusForNextStep?: string; 
}


export interface AdvancedModeProgress {
  currentStep: number; // For overall steps in advanced mode (e.g., sequential step number)
  totalSteps: number;  // Will be 0 or dynamic in sequential mode as total is unknown upfront
  stepDescription: string; // Focus of the current sequential step
  phase?: 'understanding_problem' | 'sequential_solving' | 'planning' | 'generating_textual_solution' | 'generating_verification_code' | 'complete';
}