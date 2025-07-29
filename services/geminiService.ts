
import { GoogleGenAI, Part, Tool, Content } from "@google/genai";
import type {
    GeminiSolutionResponse,
    AdvancedModeProgress,
    ModelChoice
} from '../types';
import {
    SubjectType,
    getSubjectConfig,
    detectSubjectFromProblem
} from '../config/subjectConfig';
import { createMainPrompt } from './promptTemplates';

const getApiKey = (): string => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is not configured. Please set the API_KEY environment variable.");
  }
  return apiKey;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

const cleanAndParseJson = <T>(jsonStr: string): T => {
  let cleanedJsonStr = jsonStr.trim();
  
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanedJsonStr.match(fenceRegex);
  if (match && match[1]) {
    cleanedJsonStr = match[1].trim();
  }
  
  const firstBracket = cleanedJsonStr.indexOf('{');
  const lastBracket = cleanedJsonStr.lastIndexOf('}');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    cleanedJsonStr = cleanedJsonStr.substring(firstBracket, lastBracket + 1);
  }
  
  cleanedJsonStr = cleanedJsonStr.replace(/,\s*([}\]])/g, '$1');
  
  try {
    return JSON.parse(cleanedJsonStr) as T;
  } catch (e) {
    console.error("Could not parse JSON response from Gemini:", e, "\nProcessed response:", cleanedJsonStr);
    let errorMessage = "Could not parse response from AI. Invalid JSON format.";
    if (e instanceof Error && e.message) {
      errorMessage += ` Error details: ${e.message}`;
    }
    throw new Error(errorMessage);
  }
};

export const solveProblemWithGemini = async (
  problemDescription: string,
  imageBase64: string | null,
  isAdvancedMode: boolean,
  onProgressUpdate: (progress: AdvancedModeProgress | null) => void,
  subjectType: SubjectType,
  modelChoice: ModelChoice,
  retries: number = 1
): Promise<GeminiSolutionResponse> => {
  try {
    onProgressUpdate({ currentStep: 1, totalSteps: 3, stepDescription: "Detecting subject...", phase: 'planning' });
    const detectedSubject = subjectType || detectSubjectFromProblem(problemDescription);
    const subjectConfig = getSubjectConfig(detectedSubject);

    onProgressUpdate({ currentStep: 2, totalSteps: 3, stepDescription: "Generating solution...", phase: 'generating_textual_solution' });
    
    const mainPrompt = createMainPrompt(problemDescription, imageBase64, subjectConfig, isAdvancedMode);
    
    const contents: Content[] = [];
    const parts: Part[] = [];
    if (imageBase64) {
        const mimeType = imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' :
                         imageBase64.startsWith('data:image/png') ? 'image/png' :
                         imageBase64.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
        const pureBase64 = imageBase64.split(',')[1];
        parts.push({ inlineData: { mimeType, data: pureBase64 } });
    }
    parts.push({ text: mainPrompt });
    contents.push({ role: "user", parts });

    const result = await ai.models.generateContent({
        model: modelChoice,
        contents,
        tools: isAdvancedMode ? [{ codeExecution: {} }] : undefined,
    });
    
    onProgressUpdate({ currentStep: 3, totalSteps: 3, stepDescription: "Parsing response...", phase: 'complete' });
    
    const responseText = result.text;

    if (!responseText) {
        throw new Error("The AI returned an empty response.");
    }
    
    const parsedSolution = cleanAndParseJson<GeminiSolutionResponse>(responseText);

    const finalResponse: GeminiSolutionResponse = {
        ...parsedSolution,
        detectedSubject,
        subjectConfig: {
            name: subjectConfig.name,
            description: subjectConfig.description,
        },
    };

    onProgressUpdate(null);
    return finalResponse;

  } catch (err) {
    onProgressUpdate?.(null);
    
    if (err instanceof Error && err.message.includes("Could not parse") && retries > 0) {
        console.warn(`JSON parse failed. Retrying... (${retries - 1} retries left)`);
        return solveProblemWithGemini(problemDescription, imageBase64, isAdvancedMode, onProgressUpdate, subjectType, modelChoice, retries - 1);
    }
    
    if (err instanceof Error) {
         throw err;
    }
    throw new Error('An unknown error occurred while processing the problem.');
  }
};
