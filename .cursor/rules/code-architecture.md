# BALAUR Code Architecture Guidelines

This rule provides guidance for code architecture within the BALAUR framework.

## Description
BALAUR follows a structured architectural approach to promote maintainability, extensibility, and performance.

## Files
*.ts, *.js

## Instructions
- Follow separation of concerns principles; each component should have a single responsibility
- Use composition over inheritance to build complex components
- Maintain clear boundaries between the UI, business logic, and data layers
- Keep the codebase minimal with no external dependencies beyond project standards
- Implement proper error boundaries and fallbacks for resilient applications
- Use state management patterns that align with the hypermedia-driven approach
- Prefer immutable patterns for data handling; use spread operators or Object.freeze when appropriate
- Structure directories by feature or domain rather than by technical role
- For each component or service:
  - Define clear public APIs 
  - Hide implementation details
  - Document the intended behavior
  - Add appropriate tests
- Avoid circular dependencies between modules
- Apply the Dependency Inversion Principle; depend on abstractions, not implementations
- Use factories for creating complex objects, especially for resources
- Implement proper lazy loading strategies for code that isn't immediately needed
- Apply consistent patterns for async operations, including proper error handling
- Design modules to be testable in isolation with clear dependencies

## Reference Files
@file framework/core/resource.ts
@file framework/framework_test.ts 