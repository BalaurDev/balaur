# BALAUR Framework Core Rules

This rule provides guidance for working with the core resource system.

## Description
When working with Resource class and core components, follow these guidelines:

## Files
framework/core/*.ts

## Instructions
- Resource class must maintain the HATEOAS principles
- Always include required hypermedia controls (links)
- Resource properties must be properly encapsulated with getters/setters
- JSON serialization should follow hypermedia formats
- State transitions should be clearly defined
- Ensure proper typing for all properties and methods
- Keep backward compatibility when modifying existing methods
- Add comprehensive unit tests for any new functionality
- Follow immutable patterns for properties returns (return copies, not references)

## Reference Files
@file framework/core/resource.ts
@file framework/framework_test.ts 