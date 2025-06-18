
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
  cleanedJsonStr = cleanedJsonStr.replace(/,\\s*([}\]])/g, '$1'); 
  
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

const MARKDOWN_AND_LATEX_FORMATTING_INSTRUCTIONS = `
CRITICALLY IMPORTANT - JSON FORMAT, MARKDOWN, AND LATEX (for content within JSON strings):
1.  **Absolute JSON Envelope:** Your entire response text, from the very first character to the very last character, MUST be the single JSON object. There should be no characters whatsoever (not even whitespace or comments) before the initial \`{\` or after the final \`}\` of the JSON structure.
2.  The output MUST BE a single, ABSOLUTELY VALID JSON object. NEVER include any text, explanations, pseudo-code, or non-JSON characters outside the main JSON object.
3.  All textual content fields (like 'explanation', 'finalAnswer', 'restatedProblem', etc.) MUST be formatted using **GitHub Flavored Markdown (GFM)**.
    -   Use markdown for lists (e.g., '- Item 1', '* Item 2', '1. Ordered Item'), bold (**text**), italics (*text*), inline code (\`code\`), and code blocks (e.g., \`\`\`js\\nconsole.log('hello');\\n\`\`\`).
4.  Mathematical formulas within the Markdown text MUST be written using **KaTeX/LaTeX syntax**:
    -   For inline formulas, use a single dollar sign: \`$...$\`. Example: \`$P(A) = 0.5$\`
    -   For display/block formulas, use double dollar signs: \`$$...$$\`. Example: \`$$E[X] = \\sum x_i p(x_i)$$\`
5.  **How to write Newlines and LaTeX in your JSON string values (THIS IS CRUCIAL FOR CORRECT RENDERING):**
    -   **Newlines for Markdown:** To create a newline character in your Markdown content, the JSON string value itself must contain the two-character sequence: a backslash followed by the letter 'n' (i.e., \`\\n\`).
        Example of what your JSON string output for a field should contain: \`"First paragraph.\\nSecond paragraph."\`
        (When this JSON is parsed, it becomes a string with an actual newline character, which Markdown processors will then convert to a line break.)
    -   **LaTeX Commands:** For LaTeX commands like '\\frac', '\\sum', '\\sqrt' inside math delimiters ('$' or '$$'), the JSON string value itself must contain: a DOUBLE backslash followed by the command name (e.g., \`\\\\frac\`, \`\\\\sum\`).
        Example of what your JSON string output for a field should contain: \`"The fraction is $\\\\frac{a}{b}$ and sum is $\\\\sum x_i$."\`
        (When this JSON is parsed, it becomes a string like "The fraction is $\\frac{a}{b}$ and sum is $\\sum x_i$." The single backslash before 'frac' and 'sum' is exactly what KaTeX needs.)
        Common commands needing this treatment: \\frac, \\sum, \\sqrt, \\alpha, \\beta, \\int, \\partial, \\mathrm, \\mathbf, \\mathcal, \\mathbb, \\dots, \\times, \\div, \\pm, \\approx, \\neq, \\leq, \\geq, \\cdot, \\ldots
6.  NO trailing commas at the end of JSON objects or arrays.
7.  Ensure inline LaTeX (like '$X=5$') flows naturally with text and is NOT unnecessarily broken by newlines.
    Correct list item in your Markdown (which goes into a JSON string with '\\n' for newlines): \`"- $X$: Variable X. Details here."\`
    Incorrect (avoid breaking after inline math with a newline unless it's a new paragraph): \`"- $X$\\n: Variable X."\`
8.  **AVOID DUPLICATION IN NUMERICAL AND FORMULA OUTPUT (CRITICAL):**
    -   When presenting numerical results, state them clearly and concisely **WITHOUT ANY ACCIDENTAL DUPLICATION**.
        -   **CORRECT Example (Text):** "The probability is approximately 0.123 (or 12.3%)."
        -   **INCORRECT Example (Text - DO NOT DO THIS):** "The probability is approximately 0.1230.123 (or 12.3%12.3%)."
    -   This rule applies equally to numbers within text and numbers/formulas within LaTeX.
        -   **CORRECT Example (LaTeX):** "$P(A) \\\\approx 0.5$"
        -   **INCORRECT Example (LaTeX - DO NOT DO THIS):** "$P(A) \\\\approx 0.5P(A) \\\\approx 0.5$"
        -   **CORRECT Example (Text with LaTeX):** "The value is $X \\\\approx 1.23$."
        -   **INCORRECT Example (Text with LaTeX - DO NOT DO THIS):** "The value is $X \\\\approx 1.23X \\\\approx 1.23$."
    -   You MUST carefully review your generated output for these kinds of duplications before finalizing the JSON response.
9.  **Abbreviated Variables (Optional but Recommended for Complex Formulas):** For clarity in complex explanations or formulas involving many terms, you MAY define abbreviated variable names (e.g., '$R_S$' for 'Rate of Success', '$P_F$' for 'Probability of Failure'). Ensure each abbreviation is clearly defined in the text *before* or immediately *after* its first use in a formula. This can make long formulas easier to read.
`;


const PROMPT_UNDERSTAND_PROBLEM_TEMPLATE = (problemDescription: string, imageContextNote: string) => `
You are a meticulous assistant. Your **primary and most crucial first task** is to demonstrate a thorough understanding of the problem provided.

Problem Description:
"${problemDescription}"
${imageContextNote}

Instructions for Problem Understanding (Your output will be a JSON object based on these):
1.  **Re-state the Problem (Mandatory)**: Articulate the core problem clearly and comprehensively in your own words using **GitHub Flavored Markdown**. This is to confirm you have fully grasped what is being asked. This field is ESSENTIAL and MUST be populated.
2.  List Key Information: Identify and list all significant pieces of information, data values, variables, and any explicit constraints given in the problem statement, using **Markdown list format**.
3.  Define the Goal: Clearly state what needs to be calculated, determined, or found as the final outcome of the problem, using **Markdown**.
4.  Acknowledge Image: If an image was provided, briefly acknowledge its presence and state its apparent relevance using **Markdown**. If no image was provided, state "No image was provided."

${MARKDOWN_AND_LATEX_FORMATTING_INSTRUCTIONS}

Output a SINGLE, VALID JSON object with this exact structure. Populate all fields with Markdown content according to the instructions above (especially for newlines and LaTeX commands within JSON strings):
{
  "restatedProblem": "Your comprehensive re-statement of the problem in **Markdown**.",
  "keyInformation": [
    "Key piece of info 1 (as a Markdown string, e.g., using inline LaTeX like $X=5$).",
    "Variable $Y$ is defined as...",
    "Constraint $Z < 10$ applies."
  ],
  "problemGoal": "What the AI needs to find or calculate, in **Markdown**.",
  "imageAcknowledgement": "Statement about the image (if any) or lack thereof, in **Markdown**."
}
Do not add any other text outside this JSON object. Ensure all fields are populated.
`;

// This prompt is for Normal Mode
const PROMPT_FULL_TEXTUAL_SOLUTION_TEMPLATE = (problemFocusAndContext: string, imageContextNote: string, understandingContext: string) => `
You are an expert in probability and statistics. Your task is to provide a detailed, step-by-step textual solution.

${understandingContext ? `FIRST, REVIEW THE INITIAL PROBLEM ANALYSIS:\n${understandingContext}\n---\n` : ""}

Main Task:
${problemFocusAndContext}
${imageContextNote}

${MARKDOWN_AND_LATEX_FORMATTING_INSTRUCTIONS}
(All 'explanation' and 'finalAnswer' fields MUST contain well-formatted **GitHub Flavored Markdown**. Adhere strictly to the JSON string escaping rules for newlines (use '\\n') and LaTeX commands (use '\\\\command_name').)

Output a SINGLE, VALID JSON object with this exact structure:
{
  "solutionSteps": [
    {
      "explanation": "Detailed explanation for step 1 in **Markdown**. Inline LaTeX $P(A|B)$ should flow with text. For lists like definitions: '- $X$: Description of X.\\n- $Y$: Description of Y.' Use '\\n' in JSON for newlines, and '\\\\frac' in JSON for \\frac in LaTeX."
    },
    {
      "explanation": "Detailed explanation for step 2 in **Markdown**. Adhere strictly to formatting instructions."
    }
    // ... more steps if needed
  ],
  "finalAnswer": "The final conclusive answer, derived from the textual steps, in **Markdown**. KaTeX math like $\\\\frac{a}{b}$ (from '\\\\\\\\frac{a}{b}' in JSON) is allowed and should flow naturally."
}
Ensure the JSON is absolutely valid. No other text outside this JSON object.
`;

// This prompt is for Normal Mode's verification code
const PROMPT_VERIFICATION_CODE_TEMPLATE = (originalProblem: string, fullTextualSolution: string, imageContextNote: string, understandingContext: string) => `
You are an expert JavaScript programmer tasked with verifying a textual solution.

${understandingContext ? `REVIEW THE INITIAL PROBLEM UNDERSTANDING:\n${understandingContext}\n---\n` : ""}

The original problem was:
"${originalProblem}"
${imageContextNote}

The complete textual solution provided (which should contain Markdown and correctly formatted LaTeX, e.g., $\\frac{a}{b}$ after JSON parsing) was:
"${fullTextualSolution}"

Your task is to write a single, comprehensive block of JavaScript code that computationally solves the original problem.

CRITICALLY IMPORTANT - JSON AND JAVASCRIPT CODE FORMAT:
1.  The output MUST BE a single, ABSOLUTELY VALID JSON object.
2.  The JavaScript code MUST be a single string value for the "verificationCode" key.
3.  The JavaScript code MUST use an explicit 'return <expression>;' statement as the VERY LAST part of the code if a value is to be returned.
4.  The JavaScript code should be self-contained.
5.  NO trailing commas.

The output MUST BE a valid JSON object: { "verificationCode": "JavaScript code string here. Example: const x=1; const y=2; return x+y;" }
Strictly forbidden to respond with anything other than the specified JSON object.
`;

const PROMPT_SEQUENTIAL_STEP_TEMPLATE = (
    originalProblem: string,
    imageContextNote: string,
    problemUnderstandingText: string,
    historyOfPreviousSteps: SequentialStepOutput[],
    currentFocus: string
) => `
You are an AI assistant performing sequential, step-by-step problem-solving for probability and statistics problems.
This is an iterative process. You will be given the original problem, your initial understanding, the history of steps taken so far, and a specific 'focus' for the current step.

1.  **Original Problem:** "${originalProblem}"
    ${imageContextNote}

2.  **Initial Understanding of the Problem (Markdown):**
    ${problemUnderstandingText}

3.  **History of Previous Steps Taken (if any):**
    ${historyOfPreviousSteps.length > 0 ? historyOfPreviousSteps.map((step, index) => 
        `Step ${index + 1}:
        Explanation (Markdown): ${step.stepExplanation}
        ${step.stepJsCode ? `JS Code: ${step.stepJsCode}` : ''}
        ${step.stepJsCodeResult !== undefined ? `JS Result: ${typeof step.stepJsCodeResult === 'object' ? JSON.stringify(step.stepJsCodeResult) : step.stepJsCodeResult}` : ''}
        ${step.stepJsCodeError ? `JS Error: ${step.stepJsCodeError}` : ''}`
    ).join('\n---\n') : "No previous steps taken. This is the first reasoning/calculation step after initial understanding."}

4.  **Current Focus for THIS Step:** "${currentFocus}"

**Your Task for THIS Iteration:**
Based on all the above information, particularly the 'Current Focus', perform the required reasoning or calculation.

${MARKDOWN_AND_LATEX_FORMATTING_INSTRUCTIONS}
(The 'stepExplanation' field MUST contain well-formatted **GitHub Flavored Markdown**. Adhere strictly to the JSON string escaping rules for newlines (use '\\n') and LaTeX commands (use '\\\\command_name'). JS code must be concise and directly relevant to THIS step's calculation.)

Output a SINGLE, VALID JSON object with the following exact structure:
{
  "stepExplanation": "Detailed textual explanation in **Markdown** for your reasoning and actions to address the 'Current Focus'. If this is the final step of the entire problem, this explanation MUST include a clear statement of the overall final answer in text, using correct Markdown and LaTeX (e.g., '\\\\frac{a}{b}' in JSON for $\\frac{a}{b}$).",
  "stepJsCode": "OPTIONAL: A concise, self-contained JavaScript code snippet to perform any calculation DIRECTLY related to THIS step's explanation. This code MUST use 'return <value_or_expression>;' to output its result. If no calculation is needed for this specific step, omit this field or provide an empty string.",
  "isThisTheFinalStep": boolean, // true if this step completes the entire problem, false otherwise.
  "focusForNextStep": "If 'isThisTheFinalStep' is false, provide a concise description (in simple text, not Markdown) of the objective for the VERY NEXT sequential step. If 'isThisTheFinalStep' is true, this can be an empty string or a concluding remark like 'Problem solved.'."
}
NO other text outside this JSON object.
If this is the final step, the 'stepExplanation' (as Markdown) should explicitly state the final answer. The result of 'stepJsCode' in the final step will be considered the final computed answer.
`;


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
    onProgressUpdate?: (progress: AdvancedModeProgress | null) => void
): Promise<GeminiSolutionResponse> => {
    const imageContext = imageBase64 ? "(Note: An image is attached. Consider its content.)" : "";
    
    onProgressUpdate?.({ currentStep: 0, totalSteps: 0, stepDescription: "Analyzing problem...", phase: 'understanding_problem' });
    let problemUnderstanding: ProblemUnderstanding | undefined;
    try {
        const understandingPrompt = PROMPT_UNDERSTAND_PROBLEM_TEMPLATE(problemDescription, imageContext);
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
    const fullSolutionPrompt = PROMPT_FULL_TEXTUAL_SOLUTION_TEMPLATE(textualProblemFocus, imageContext, understandingContext);

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
    const verificationCodePrompt = PROMPT_VERIFICATION_CODE_TEMPLATE(problemDescription, fullTextualSolutionSummary, imageContext, understandingContext);
    
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
        verificationCode: verificationCode || undefined
    };
};

const solveAdvancedProblem = async ( // Sequential Thinking Mode
    problemDescription: string, 
    imageBase64: string | null,
    onProgressUpdate?: (progress: AdvancedModeProgress | null) => void
): Promise<GeminiSolutionResponse> => {
    const originalImageContext = imageBase64 ? "(Note: An image is attached to the original problem. Consider its content.)" : "";

    onProgressUpdate?.({ currentStep: 0, totalSteps: 0, stepDescription: "Analyzing problem...", phase: 'understanding_problem' });
    let problemUnderstanding: ProblemUnderstanding | undefined;
    try {
        const understandingPrompt = PROMPT_UNDERSTAND_PROBLEM_TEMPLATE(problemDescription, originalImageContext);
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

        const sequentialStepPrompt = PROMPT_SEQUENTIAL_STEP_TEMPLATE(
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
        }
    };
};

export const solveProblemWithGemini = async (
  problemDescription: string, 
  imageBase64: string | null,
  isAdvancedMode: boolean,
  onProgressUpdate?: (progress: AdvancedModeProgress | null) => void,
  // Thêm tham số retries
  retries: number = 1
): Promise<GeminiSolutionResponse> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API Key is not configured. Please set the API_KEY environment variable.");
    }
    if (isAdvancedMode) {
      return await solveAdvancedProblem(problemDescription, imageBase64, onProgressUpdate);
    } else {
      return await solveSingleStepProblem(problemDescription, imageBase64, onProgressUpdate);
    }
  } catch (err) {
    onProgressUpdate?.(null);
    
    // Nếu lỗi là do parsing VÀ vẫn còn lượt thử lại
    if (err instanceof Error && err.message.includes("Could not parse") && retries > 0) {
        console.warn(`JSON parse failed. Retrying... (${retries - 1} retries left)`);
        // Gọi lại hàm với số lượt thử lại giảm đi 1
        return solveProblemWithGemini(problemDescription, imageBase64, isAdvancedMode, onProgressUpdate, retries - 1);
    }
    
    if (err instanceof Error) {
         throw err; 
    }
    throw new Error('An unknown error occurred while processing the problem.');
  }
};
