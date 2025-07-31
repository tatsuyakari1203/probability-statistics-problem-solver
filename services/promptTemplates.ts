import { SubjectConfig } from '../config/subjectConfig';

export const createMainPrompt = (
  problemDescription: string,
  imageBase64: string | null,
  documentFile: File | null,
  subjectConfig: SubjectConfig,
  isAdvancedMode: boolean
) => {
  const imageContextNote = imageBase64 ? "(Note: An image is attached. Consider its content.)" : "";
  const documentContextNote = documentFile ? "(Note: A document has been uploaded. Prioritize its content as the primary source of information for solving the problem.)" : "";

  const advancedModeInstructions = `
-   When calculations are needed, use the Code Execution tool to generate and run Python code.
-   The \`code\` field in the JSON output should contain the Python code to be executed.
`;

  const standardModeInstructions = `
-   Provide a clear, step-by-step textual explanation for the solution.
`;

  return `
You are a meticulous, expert assistant specializing in ${subjectConfig.name}. ${subjectConfig.promptModifications.systemContext}

Your task is to solve the following problem and provide a detailed, step-by-step solution in a structured JSON format.

**Problem Description:**
"${problemDescription}"
${imageContextNote}
${documentContextNote}

**Instructions:**
1.  **Analyze the Problem:** In the \`problemAnalysis\` section, restate the problem, list the key information, and define the goal.
2.  **Solve Step-by-Step:** In the \`solution\` section, provide a series of steps. Each step should have an \`explanation\` and, if necessary, a \`code\` field.
${isAdvancedMode ? advancedModeInstructions : standardModeInstructions}
3.  **Final Answer:** In the \`finalAnswer\` section, provide the final, conclusive answer.

**CRITICAL JSON FORMATTING RULES:**
- Output ONLY a single, valid JSON object
- Use SINGLE backslashes in LaTeX math expressions (e.g., "$\mu$" not "$\\mu$")
- Never use double backslashes (\\) in JSON strings - they cause parsing errors
- Escape quotes properly with single backslashes
- Do NOT include any text before or after the JSON
- Ensure all strings are properly quoted
- Test your JSON mentally before outputting to ensure it's valid

**Output a SINGLE, VALID JSON object with this exact structure:**
{
  "problemAnalysis": {
    "restatedProblem": "...",
    "keyInformation": ["...", "..."],
    "problemGoal": "..."
  },
  "solution": [
    {
      "explanation": "...",
      "code": "..."
    }
  ],
  "finalAnswer": "..."
}

**LaTeX Math Examples in JSON:**
- Correct: "The mean $\mu = 175$ cm"
- Incorrect: "The mean $\\mu = 175$ cm"
- Correct: "Standard deviation $\sigma = 7$"
- Incorrect: "Standard deviation $\\sigma = 7$"
- Correct: "We have $P(X > 185) = 1 - \Phi(z)$"
- Incorrect: "We have $P(X > 185) = 1 - \\Phi(z)$"

**Example of properly formatted JSON response:**
\`\`\`json
{
  \"problemAnalysis\": {
    \"restatedProblem\": \"Calculate probability for normal distribution with $\\mu = 175$ and $\\sigma = 7$\",
    \"keyInformation\": [\"Normal distribution\", \"Mean $\\mu = 175$ cm\"],
    \"problemGoal\": \"Find $P(X > 185)$\"
  },
  \"solution\": [
    {
      \"explanation\": \"Convert to standard normal: $Z = \\frac{X - \\mu}{\\sigma}$\"
    }
  ],
  \"finalAnswer\": \"The probability is approximately 7.64%\"
}
\`\`\`

Format all textual content using GitHub Flavored Markdown. Use LaTeX for math with SINGLE backslashes only.
`;
};

export const createSuggestionPrompt = (subject: string, existingSolution?: string) => {
  const context = existingSolution
    ? `Based on the following recently solved problem, suggest new, related problems. Solution: "${existingSolution}"`
    : `Suggest a diverse and interesting set of random problems related to ${subject}.`;

  return `
You are an expert assistant for a learning application that helps users solve problems in various subjects, including Probability & Statistics, Chemistry, and Calculus. Your task is to generate a list of 6-8 interesting and relevant sample problems for the selected subject: ${subject}.

${context}

**Instructions:**
1.  Provide a list of 6-8 unique problem statements.
2.  The problems should be well-suited for a learning environment, ranging from foundational concepts to more challenging applications.
3.  For each problem, provide a short, catchy label that includes a relevant emoji at the beginning (e.g., "🪙 Coin Toss," "🎲 Bayes' Theorem").
4.  The problems should be varied and cover different aspects of the subject.
5.  Output a SINGLE, VALID JSON object with this exact structure:
    {
      "suggestions": [
        {
          "label": "...",
          "text": "..."
        }
      ]
    }
`;
};