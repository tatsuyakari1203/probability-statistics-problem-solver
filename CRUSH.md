## Build, Lint, and Test Commands

- **Development Server**: `npm run dev`
- **Production Build**: `npm run build`
- **Preview Production Build**: `npm run preview`

*No explicit lint or test commands found. Add them here if they exist.*

## Code Style and Conventions

### Imports

- **React**: Import React at the top of the file: `import * as React from 'react';`
- **Hooks**: Import React hooks individually: `import { useState, useCallback } from 'react';`
- **Components**: Use relative paths for component imports: `import { ProblemInput } from './components/ProblemInput';`
- **Types**: Import types with the `type` keyword: `import type { GeminiSolutionResponse } from './types';`

### Formatting

- **Indentation**: Use 2 spaces for indentation.
- **Semicolons**: Use semicolons at the end of statements.
- **Line Length**: Keep lines under 120 characters.

### Naming Conventions

- **Components**: Use PascalCase for component names (e.g., `ProblemInput`).
- **Variables and Functions**: Use camelCase (e.g., `handleSubmitProblem`).
- **State Variables**: Use the `[name, setName]` pattern for `useState` hooks.
- **Interfaces and Types**: Use PascalCase for type and interface names (e.g., `ProblemInputProps`).

### Types

- **Props**: Define props with an interface and type the component with `React.FC<Props>`.
- **State**: Explicitly type `useState` hooks: `useState<string | null>(null)`.
- **Functions**: Type function arguments and return values.

### Error Handling

- Use `try...catch` blocks for asynchronous operations.
- Provide specific error messages based on the error type.
- Use a state variable to store and display error messages to the user.

### Miscellaneous

- **Styling**: Uses Tailwind CSS for styling.
- **State Management**: Uses React hooks (`useState`, `useCallback`, etc.) for state management.
- **Async**: Use `async/await` for asynchronous operations.
