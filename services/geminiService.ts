
import { GoogleGenAI, Part, Tool, Content } from "@google/genai";
import type {
    GeminiSolutionResponse,
    AdvancedModeProgress,
    ModelChoice,
    SolutionStep
} from '../types';
import {
    SubjectType,
    getSubjectConfig,
    detectSubjectFromProblem
} from '../config/subjectConfig';
import { createMainPrompt, createSuggestionPrompt } from './promptTemplates';

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
  documentFile: File | null,
  isAdvancedMode: boolean,
  onProgressUpdate: (progress: AdvancedModeProgress | null) => void,
  subjectType: SubjectType,
  modelChoice: ModelChoice,
  retries: number = 1
): Promise<GeminiSolutionResponse> => {
  let uploadedFile;
  try {
    onProgressUpdate({ currentStep: 1, totalSteps: 2, stepDescription: "Initializing...", phase: 'planning' });
    const detectedSubject = subjectType || detectSubjectFromProblem(problemDescription);
    const subjectConfig = getSubjectConfig(detectedSubject);

    const mainPrompt = createMainPrompt(problemDescription, imageBase64, documentFile, subjectConfig, isAdvancedMode);
    
    const contents: Content[] = [];
    const parts: Part[] = [];
    if (imageBase64) {
        const mimeType = imageBase64.startsWith('data:image/jpeg') ? 'image/jpeg' :
                         imageBase64.startsWith('data:image/png') ? 'image/png' :
                         imageBase64.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
        const pureBase64 = imageBase64.split(',')[1];
        parts.push({ inlineData: { mimeType, data: pureBase64 } });
    }

    if (documentFile) {
      onProgressUpdate({ currentStep: 1, totalSteps: 3, stepDescription: "Uploading document...", phase: 'planning' });
      uploadedFile = await ai.files.upload({
        file: documentFile,
      });
      parts.push({ fileData: { mimeType: uploadedFile.mimeType, fileUri: uploadedFile.uri } });
    }

    parts.push({ text: mainPrompt });
    contents.push({ role: "user", parts });

    const stream = await ai.models.generateContentStream({
        model: modelChoice,
        contents,
        tools: isAdvancedMode ? [{ codeExecution: {} }] : undefined,
    } as any);

    let accumulatedText = "";
    onProgressUpdate({ currentStep: 2, totalSteps: 2, stepDescription: "Model is thinking...", phase: 'generating_textual_solution', streamedContent: "..." });

    for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
            accumulatedText += chunkText;
            onProgressUpdate({
                currentStep: 2,
                totalSteps: 2,
                stepDescription: "Receiving solution...",
                phase: 'generating_textual_solution',
                streamedContent: accumulatedText
            });
        }
    }

    if (!accumulatedText) {
        throw new Error("The AI returned an empty response.");
    }
    
    const parsedSolution = cleanAndParseJson<GeminiSolutionResponse>(accumulatedText);

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
        return solveProblemWithGemini(problemDescription, imageBase64, documentFile, isAdvancedMode, onProgressUpdate, subjectType, modelChoice, retries - 1);
    }
    
    if (err instanceof Error) {
         throw err;
    }
    throw new Error('An unknown error occurred while processing the problem.');
  } finally {
    if (uploadedFile) {
      if (uploadedFile.name) {
        await ai.files.delete({ name: uploadedFile.name });
      }
    }
  }
};

export const getProblemSuggestions = async (
  subject: SubjectType,
  existingSolution?: string
): Promise<{ label: string; text: string }[]> => {
  try {
    const subjectConfig = getSubjectConfig(subject);
    const prompt = createSuggestionPrompt(subjectConfig.name, existingSolution);
    
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = result.text;
    if (!response) {
      return [];
    }
    
    const parsed = cleanAndParseJson<{ suggestions: { label: string; text: string }[] }>(response);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("Error fetching problem suggestions:", error);
    return [];
  }
};
