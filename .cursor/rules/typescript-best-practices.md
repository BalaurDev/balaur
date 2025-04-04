# BALAUR TypeScript Best Practices

This rule provides best practices for TypeScript development in the BALAUR framework.

## Description
When working with TypeScript in the BALAUR framework, follow these guidelines:

## Files
*.ts, *.tsx

## Instructions
- Use strict TypeScript typing throughout the codebase
- Write concise, technical TypeScript code with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Prefer iteration and modularization over code duplication
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
- Use the "function" keyword for pure functions to improve clarity and readability
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements
- Use early returns to avoid deep nesting and improve readability
- Prefer interfaces over types for public APIs and better extendability
- Avoid enums; use const objects with 'as const' assertion instead
- Always specify return types for functions and methods
- Use generics judiciously to create reusable, type-safe components
- Leverage TypeScript's discriminated unions for better type safety
- Implement proper error handling with typed errors
- Keep functions small and focused on a single task
- Use optional chaining and nullish coalescing for safer property access

## Reference Files
@file framework/core/resource.ts
@file framework/store/resource-store.ts 