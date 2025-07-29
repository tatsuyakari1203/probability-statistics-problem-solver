import { SubjectConfig } from '../config/subjectConfig';

const MARKDOWN_AND_LATEX_FORMATTING_INSTRUCTIONS = `
CRITICALLY IMPORTANT - JSON FORMAT, MARKDOWN, AND LATEX:
1.  **Absolute JSON Envelope:** Your entire response MUST be a single, valid JSON object. No text before or after.
2.  **Markdown Content:** All textual fields (e.g., 'explanation', 'finalAnswer') MUST be formatted using GitHub Flavored Markdown (GFM).
3.  **LaTeX for Math:** Use KaTeX/LaTeX for math. Inline: \`$...$\`, block: \`$$...$$\`.
4.  **JSON String Escaping (CRUCIAL):**
    -   For newlines in Markdown, use the two-character sequence \`\\n\`.
    -   For LaTeX commands (e.g., \\frac, \\sum), use a DOUBLE backslash: \`\\\\frac\`, \`\\\\sum\`.
5.  **No Trailing Commas:** Ensure no trailing commas in JSON objects or arrays.
`;

export const createMainPrompt = (
  problemDescription: string,
  imageBase64: string | null,
  subjectConfig: SubjectConfig,
  isAdvancedMode: boolean
) => {
  const imageContextNote = imageBase64 ? "(Note: An image is attached. Consider its content.)" : "";

  const advancedModeInstructions = `
**Advanced Mode (Code Execution):**
You have a powerful tool: a sandboxed Python code interpreter.
-   For each step requiring calculation, you MUST provide a \`verificationCode\` field containing the Python code to solve that part of the problem.
-   The code will be executed, and the result will be available to you. This is ideal for complex calculations, simulations, or data analysis.
-   Use libraries like \`numpy\`, \`scipy\`, and \`sympy\` for robust calculations.
-   Your textual \`explanation\` should describe the logic, and the \`verificationCode\` should perform the actual computation.
`;

  const standardModeInstructions = `
**Standard Mode (Textual Solution):**
-   Provide a clear, step-by-step textual explanation for the solution.
-   For each step, you may optionally provide a \`verificationCode\` field with Python code to verify the calculation. This is recommended for accuracy but not strictly required for every step.
`;

  return `
You are a meticulous, expert assistant specializing in ${subjectConfig.name}. ${subjectConfig.promptModifications.systemContext}

Your task is to solve the following problem and provide a detailed, step-by-step solution.

**Problem Description:**
"${problemDescription}"
${imageContextNote}

**Mode:** ${isAdvancedMode ? 'Advanced (Code Execution)' : 'Standard (Textual)'}

**Instructions:**
1.  **Understand the Problem:** First, internally understand the problem. Restate it, identify key information, and define the goal.
2.  **Solve Step-by-Step:** Break the solution into logical steps.
3.  **Provide Code for Calculations:**
    ${isAdvancedMode ? advancedModeInstructions : standardModeInstructions}
4.  **Final Answer:** Conclude with a clear final answer.

${MARKDOWN_AND_LATEX_FORMATTING_INSTRUCTIONS}

**Output a SINGLE, VALID JSON object with this exact structure:**
{
  "problemUnderstanding": {
    "restatedProblem": "Your comprehensive re-statement of the problem in Markdown.",
    "keyInformation": [
      "Key piece of info 1 (as a Markdown string).",
      "Variable $Y$ is defined as..."
    ],
    "problemGoal": "What needs to be calculated or found, in Markdown.",
    "imageAcknowledgement": "Statement about the image (if any), in Markdown."
  },
  "solutionSteps": [
    {
      "explanation": "Detailed explanation for step 1 in Markdown. Use LaTeX for formulas like $\\\\frac{a}{b}$.",
      "verificationCode": "Optional[String] - Python code for this step's calculation. e.g., 'import numpy as np\\nprint(np.mean([1,2,3]))'"
    },
    {
      "explanation": "Detailed explanation for step 2 in Markdown.",
      "verificationCode": "..."
    }
  ],
  "finalAnswer": "The final conclusive answer, in Markdown."
}

Ensure the JSON is absolutely valid. No other text outside this JSON object.
`;
};