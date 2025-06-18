// Subject-specific prompt templates for different academic disciplines

import { SubjectType, getSubjectConfig, SubjectConfig } from '../config/subjectConfig';

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

export const createUnderstandProblemPrompt = (
  problemDescription: string, 
  imageContextNote: string, 
  subjectConfig: SubjectConfig
) => `
You are a meticulous assistant specializing in ${subjectConfig.name}. ${subjectConfig.promptModifications.systemContext}

Your **primary and most crucial first task** is to demonstrate a thorough understanding of the problem provided.

Problem Description:
"${problemDescription}"
${imageContextNote}

Instructions for Problem Understanding (Your output will be a JSON object based on these):
1.  **Re-state the Problem (Mandatory)**: Articulate the core problem clearly and comprehensively in your own words using **GitHub Flavored Markdown**. This is to confirm you have fully grasped what is being asked. This field is ESSENTIAL and MUST be populated.
2.  List Key Information: ${subjectConfig.promptModifications.problemAnalysisInstructions} Use **Markdown list format**.
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

export const createFullTextualSolutionPrompt = (
  problemFocusAndContext: string, 
  imageContextNote: string, 
  understandingContext: string, 
  subjectConfig: SubjectConfig
) => `
You are an expert in ${subjectConfig.name}. ${subjectConfig.promptModifications.systemContext} Your task is to provide a detailed, step-by-step textual solution.

${understandingContext ? `FIRST, REVIEW THE INITIAL PROBLEM ANALYSIS:\n${understandingContext}\n---\n` : ""}

Main Task:
${problemFocusAndContext}
${imageContextNote}

Solution Approach: ${subjectConfig.promptModifications.solutionApproach}

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

export const createVerificationCodePrompt = (
  originalProblem: string, 
  fullTextualSolution: string, 
  imageContextNote: string, 
  understandingContext: string, 
  subjectConfig: SubjectConfig
) => `
You are an expert JavaScript programmer with deep knowledge in ${subjectConfig.name}. ${subjectConfig.promptModifications.systemContext} Your task is to write verification code for a textual solution.

${understandingContext ? `REVIEW THE INITIAL PROBLEM UNDERSTANDING:\n${understandingContext}\n---\n` : ""}

The original problem was:
"${originalProblem}"
${imageContextNote}

The complete textual solution provided (which should contain Markdown and correctly formatted LaTeX, e.g., $\\frac{a}{b}$ after JSON parsing) was:
"${fullTextualSolution}"

Your task is to write a single, comprehensive block of JavaScript code that computationally solves the original problem.

Code Requirements: ${subjectConfig.promptModifications.verificationCodeInstructions}

CRITICALLY IMPORTANT - JSON AND JAVASCRIPT CODE FORMAT:
1.  The output MUST BE a single, ABSOLUTELY VALID JSON object.
2.  The JavaScript code MUST be a single string value for the "verificationCode" key.
3.  The JavaScript code MUST use an explicit 'return <expression>;' statement as the VERY LAST part of the code if a value is to be returned.
4.  The JavaScript code should be self-contained.
5.  NO trailing commas.

The output MUST BE a valid JSON object: { "verificationCode": "JavaScript code string here. Example: const x=1; const y=2; return x+y;" }
Strictly forbidden to respond with anything other than the specified JSON object.
`;

export const createSequentialStepPrompt = (
  originalProblem: string,
  imageContextNote: string,
  problemUnderstandingText: string,
  historyOfPreviousSteps: any[],
  currentFocus: string,
  subjectConfig: SubjectConfig
) => `
You are an AI assistant performing sequential, step-by-step problem-solving for ${subjectConfig.name} problems. ${subjectConfig.promptModifications.systemContext}
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

Solution Approach: ${subjectConfig.promptModifications.solutionApproach}

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