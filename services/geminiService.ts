
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import type { 
    GeminiSolutionResponse, 
    SolutionStep, 
    AdvancedModeProgress, 
    ProblemUnderstanding,
    SequentialStepOutput,
    AISequentialStepResponse
} from '../types';
import { GEMINI_MODEL_TEXT } from '../constants';
import { 
    SubjectType, 
    getSubjectConfig, 
    detectSubjectFromProblem 
} from '../config/subjectConfig';
import {
    createUnderstandProblemPrompt,
    createFullTextualSolutionPrompt,
    createVerificationCodePrompt,
    createSequentialStepPrompt,
    createSubjectAwarePrompts
} from './promptTemplates';

const getApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is not configured. Please set the API_KEY environment variable.");
  }
  return apiKey;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const cleanAndParseJson = <T>(jsonStr: string, originalJsonStrForDebug?: string): T => {
  let cleanedJsonStr = jsonStr.trim();
  
  // 1. Cố gắng tìm và trích xuất nội dung từ các khối mã ```json ... ``` hoặc ``` ... ```
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanedJsonStr.match(fenceRegex);
  if (match && match[1]) {
    cleanedJsonStr = match[1].trim();
  }
  
  // 2. Nếu không có khối mã, hãy tìm đối tượng JSON đầu tiên trong chuỗi
  // Điều này giúp loại bỏ văn bản giới thiệu/kết luận mà AI có thể thêm vào
  const firstBracket = cleanedJsonStr.indexOf('{');
  const lastBracket = cleanedJsonStr.lastIndexOf('}');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    cleanedJsonStr = cleanedJsonStr.substring(firstBracket, lastBracket + 1);
  }
  
  // 3. Dọn dẹp các lỗi phổ biến như dấu phẩy cuối (trailing commas)
  cleanedJsonStr = cleanedJsonStr.replace(/,\s*([}\]])/g, '$1'); 
  
  try {
    return JSON.parse(cleanedJsonStr) as T;
  } catch (e) {
    console.error(
        "Could not parse JSON response from Gemini:", e, 
        "\nProcessed response (fed to JSON.parse):", cleanedJsonStr, 
        "\nOriginal API response (if available):", originalJsonStrForDebug || jsonStr
    );
    let errorMessage = "Could not parse response from AI. Invalid JSON format.";
    if (e instanceof Error && e.message) {
      errorMessage += ` Error details: ${e.message}`;
    }
    throw new Error(errorMessage);
  }
};

// Helper function to create subject-aware prompts
const createSubjectAwarePrompts = (subjectType: SubjectType) => {
    const subjectConfig = getSubjectConfig(subjectType);
    return {
        understandProblem: (problemDescription: string, imageContextNote: string) => 
            createUnderstandProblemPrompt(problemDescription, imageContextNote, subjectConfig),
        
        fullTextualSolution: (problemFocusAndContext: string, imageContextNote: string, understandingContext: string) => 
            createFullTextualSolutionPrompt(problemFocusAndContext, imageContextNote, understandingContext, subjectConfig),
        
        verificationCode: (originalProblem: string, fullTextualSolution: string, imageContextNote: string, understandingContext: string) => 
            createVerificationCodePrompt(originalProblem, fullTextualSolution, imageContextNote, understandingContext, subjectConfig),
        
        sequentialStep: (originalProblem: string, imageContextNote: string, problemUnderstandingText: string, historyOfPreviousSteps: any[], currentFocus: string) => 
            createSequentialStepPrompt(originalProblem, imageContextNote, problemUnderstandingText, historyOfPreviousSteps, currentFocus, subjectConfig)
    };
};

const callGeminiAPI = async (prompt: string, imageBase64: string | null): Promise<string> => {
    const requestParts: Part[] = [];
    if (imageBase64) {
        const mimeType = imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 
                         imageBase64.startsWith('data:image/png') ? 'image/png' : 
                         imageBase64.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
        const pureBase64 = imageBase64.split(',')[1];
        requestParts.push({ inlineData: { mimeType: mimeType, data: pureBase64 } });
    }
    requestParts.push({ text: prompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: { parts: requestParts },
        config: { responseMimeType: "application/json" }, 
    });
    return response.text;
};

const formatUnderstandingForContext = (understanding: ProblemUnderstanding | undefined): string => {
    if (!understanding) return "";
    // Content is already Markdown, so just pass it through with labels
    return `AI's Problem Analysis (Markdown):\n- Restated Problem:\n${understanding.restatedProblem}\n- Key Information:\n${understanding.keyInformation.map(info => `- ${info}`).join('\n')}\n- Goal:\n${understanding.problemGoal}\n- Image:\n${understanding.imageAcknowledgement}`;
};

interface TextualSolutionResponse { // For Normal Mode
    solutionSteps: SolutionStep[];
    finalAnswer: string;
}

const solveSingleStepProblem = async ( // Normal Mode
    problemDescription: string, 
    imageBase64: string | null, 
    onProgressUpdate?: (progress: AdvancedModeProgress | null) => void,
    subjectType?: SubjectType
): Promise<GeminiSolutionResponse> => {
    const imageContext = imageBase64 ? "(Note: An image is attached. Consider its content.)" : "";
    
    // Auto-detect subject if not provided
    const detectedSubject = subjectType || detectSubjectFromProblem(problemDescription);
    const subjectConfig = getSubjectConfig(detectedSubject);
    const prompts = createSubjectAwarePrompts(detectedSubject);
    
    onProgressUpdate?.({ currentStep: 0, totalSteps: 0, stepDescription: "Analyzing problem...", phase: 'understanding_problem' });
    let problemUnderstanding: ProblemUnderstanding | undefined;
    try {
        const understandingPrompt = prompts.understandProblem(problemDescription, imageContext);
        const rawUnderstandingResponse = await callGeminiAPI(understandingPrompt, imageBase64);
        problemUnderstanding = cleanAndParseJson<ProblemUnderstanding>(rawUnderstandingResponse, rawUnderstandingResponse);
    } catch (understandError) {
        onProgressUpdate?.(null);
        throw new Error(`Error understanding problem: ${understandError instanceof Error ? understandError.message : String(understandError)}`);
    }
    const understandingContext = formatUnderstandingForContext(problemUnderstanding);

    onProgressUpdate?.({ currentStep: 0, totalSteps: 0, stepDescription: "Generating textual solution...", phase: 'generating_textual_solution' });
    
    let textualSolutionSteps: SolutionStep[] = [];
    let textualFinalAnswer: string = "";
    
    const textualProblemFocus = `For the following problem, provide a detailed step-by-step textual solution in English, using **GitHub Flavored Markdown** for all explanations.\nProblem: ${problemDescription}`;
    const fullSolutionPrompt = prompts.fullTextualSolution(textualProblemFocus, imageContext, understandingContext);

    try {
        const rawFullSolutionResponse = await callGeminiAPI(fullSolutionPrompt, imageBase64);
        const parsedSolution = cleanAndParseJson<TextualSolutionResponse>(rawFullSolutionResponse, rawFullSolutionResponse);
        textualSolutionSteps = parsedSolution.solutionSteps || [];
        textualFinalAnswer = parsedSolution.finalAnswer || "";
    } catch (solutionError) {
        onProgressUpdate?.(null);
        throw new Error(`Error generating textual solution: ${solutionError instanceof Error ? solutionError.message : String(solutionError)}`);
    }
        
    onProgressUpdate?.({ currentStep: 0, totalSteps: 0, stepDescription: "Generating verification code...", phase: 'generating_verification_code' });
    let verificationCode = "";
    const fullTextualSolutionSummary = textualSolutionSteps.map(s => s.explanation).join('\n\n---\n\n') + `\n\n**Final Answer (Textual - Markdown):**\n${textualFinalAnswer}`;
    const verificationCodePrompt = prompts.verificationCode(problemDescription, fullTextualSolutionSummary, imageContext, understandingContext);
    
    try {
        const rawVerificationResponse = await callGeminiAPI(verificationCodePrompt, imageBase64);
        const verificationResponse = cleanAndParseJson<{verificationCode?: string}>(rawVerificationResponse, rawVerificationResponse);
        verificationCode = verificationResponse.verificationCode || "";
    } catch (apiError) {
        console.error("Gemini API Error (single-step, verification code phase):", apiError);
    }

    onProgressUpdate?.(null); 

    return {
        problemUnderstanding,
        solutionSteps: textualSolutionSteps,
        finalAnswer: textualFinalAnswer,
        verificationCode,
        groundingChunks: [],
        detectedSubject,
        subjectConfig
    };
};

const solveAdvancedProblem = async ( // Sequential Thinking Mode
    problemDescription: string, 
    imageBase64: string | null,
    onProgressUpdate?: (progress: AdvancedModeProgress | null) => void,
    subjectType?: SubjectType
): Promise<GeminiSolutionResponse> => {
    const originalImageContext = imageBase64 ? "(Note: An image is attached to the original problem. Consider its content.)" : "";

    // Auto-detect subject if not provided
    const detectedSubject = subjectType || detectSubjectFromProblem(problemDescription);
    const subjectConfig = getSubjectConfig(detectedSubject);
    const prompts = createSubjectAwarePrompts(detectedSubject);

    onProgressUpdate?.({ currentStep: 0, totalSteps: 0, stepDescription: "Analyzing problem...", phase: 'understanding_problem' });
    let problemUnderstanding: ProblemUnderstanding | undefined;
    try {
        const understandingPrompt = prompts.understandProblem(problemDescription, originalImageContext);
        const rawUnderstandingResponse = await callGeminiAPI(understandingPrompt, imageBase64);
        problemUnderstanding = cleanAndParseJson<ProblemUnderstanding>(rawUnderstandingResponse, rawUnderstandingResponse);
    } catch (understandError) {
        onProgressUpdate?.(null);
        throw new Error(`Error understanding problem (Advanced): ${understandError instanceof Error ? understandError.message : String(understandError)}`);
    }
    const understandingContextText = formatUnderstandingForContext(problemUnderstanding);

    const sequentialStepsHistory: SequentialStepOutput[] = [];
    let currentFocusForAI = problemUnderstanding?.problemGoal || "Achieve the main goal of the problem by thinking step-by-step."; // Focus is plain text
    let isFinalStepInSequence = false;
    let sequentialStepCounter = 0;
    const MAX_SEQUENTIAL_STEPS = 10;
    let finalComputedAnswer: any;
    let finalSummaryText: string = ""; // This will be Markdown

    while (!isFinalStepInSequence && sequentialStepCounter < MAX_SEQUENTIAL_STEPS) {
        sequentialStepCounter++;
        onProgressUpdate?.({ 
            currentStep: sequentialStepCounter, 
            totalSteps: 0, 
            stepDescription: `Thinking about: "${currentFocusForAI}"`,
            phase: 'sequential_solving', 
        });

        const sequentialStepPrompt = prompts.sequentialStep(
            problemDescription,
            originalImageContext,
            understandingContextText, // This is already formatted as Markdown context
            sequentialStepsHistory, // History explanations are already Markdown
            currentFocusForAI // Plain text focus
        );
        
        try {
            const rawAIResponse = await callGeminiAPI(sequentialStepPrompt, imageBase64);
            const aiStepOutput = cleanAndParseJson<AISequentialStepResponse>(rawAIResponse, rawAIResponse);

            const currentStepResult: SequentialStepOutput = {
                stepExplanation: aiStepOutput.stepExplanation, // This is Markdown
                stepJsCode: aiStepOutput.stepJsCode,
            };

            if (aiStepOutput.stepJsCode && aiStepOutput.stepJsCode.trim() !== "") {
                try {
                    let codeToExecute = aiStepOutput.stepJsCode.trim();
                    // Basic cleaning for executable JS code
                    codeToExecute = codeToExecute.replace(/\$\$([\s\S]*?)\$\$/g, ''); 
                    codeToExecute = codeToExecute.replace(/\$([^$]*?)\$/g, '');     
                    codeToExecute = codeToExecute.replace(/\/\*[\s\S]*?\*\//g, ''); 
                    codeToExecute = codeToExecute.replace(/\/\/.*$/gm, '');          
                    codeToExecute = codeToExecute.trim();

                    if (codeToExecute) {
                       currentStepResult.stepJsCodeResult = new Function(codeToExecute)();
                    }
                } catch (e) {
                    currentStepResult.stepJsCodeError = e instanceof Error ? e.message : String(e);
                    console.error(`Error executing JS for sequential step ${sequentialStepCounter}:`, e, "\nCode:", aiStepOutput.stepJsCode);
                }
            }
            
            sequentialStepsHistory.push(currentStepResult);
            isFinalStepInSequence = aiStepOutput.isThisTheFinalStep;
            currentFocusForAI = aiStepOutput.focusForNextStep || "Summarize findings and conclude."; // Plain text

            if (isFinalStepInSequence) {
                finalComputedAnswer = currentStepResult.stepJsCodeResult;
                finalSummaryText = aiStepOutput.stepExplanation; // Markdown
            }

        } catch (stepError) {
             const errorStep: SequentialStepOutput = {
                stepExplanation: `**Error processing AI response for sequential step (focus: "${currentFocusForAI}"):**\n\n\`\`\`\n${stepError instanceof Error ? stepError.message : String(stepError)}\n\`\`\``, // Format error as Markdown
             };
             sequentialStepsHistory.push(errorStep);
             isFinalStepInSequence = true; 
             finalSummaryText = errorStep.stepExplanation; // Markdown
        }
    }
     if (sequentialStepCounter >= MAX_SEQUENTIAL_STEPS && !isFinalStepInSequence) {
        const haltExplanation = `**Advanced mode exceeded maximum sequential steps (${MAX_SEQUENTIAL_STEPS}). Process halted.**\n\nCurrent focus was: "${currentFocusForAI}"`;
        sequentialStepsHistory.push({
            stepExplanation: haltExplanation, // Markdown
        });
        finalSummaryText = haltExplanation; // Markdown
    }
    
    onProgressUpdate?.(null); 

    return { 
        problemUnderstanding,
        sequentialSolution: {
            steps: sequentialStepsHistory,
            finalComputedAnswer: finalComputedAnswer,
            finalSummaryText: finalSummaryText // Markdown
        },
        detectedSubject,
        subjectConfig
    };
};

export const solveProblemWithGemini = async (
  problemDescription: string, 
  imageBase64: string | null,
  isAdvancedMode: boolean,
  onProgressUpdate?: (progress: AdvancedModeProgress | null) => void,
  subjectType?: SubjectType,
  // Thêm tham số retries
  retries: number = 1
): Promise<GeminiSolutionResponse> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API Key is not configured. Please set the API_KEY environment variable.");
    }
    if (isAdvancedMode) {
            return await solveAdvancedProblem(problemDescription, imageBase64, onProgressUpdate, subjectType);
        } else {
            return await solveSingleStepProblem(problemDescription, imageBase64, onProgressUpdate, subjectType);
        }
  } catch (err) {
    onProgressUpdate?.(null);
    
    // Nếu lỗi là do parsing VÀ vẫn còn lượt thử lại
    if (err instanceof Error && err.message.includes("Could not parse") && retries > 0) {
        console.warn(`JSON parse failed. Retrying... (${retries - 1} retries left)`);
        // Gọi lại hàm với số lượt thử lại giảm đi 1
        return solveProblemWithGemini(problemDescription, imageBase64, isAdvancedMode, onProgressUpdate, subjectType, retries - 1);
    }
    
    if (err instanceof Error) {
         throw err; 
    }
    throw new Error('An unknown error occurred while processing the problem.');
  }
};
