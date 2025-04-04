# BALAUR Framework Store Rules

This rule provides guidance for working with the store system.

## Description
When working with ResourceStore and storage implementations, follow these guidelines:

## Files
framework/store/*.ts

## Instructions
- All store operations should be async
- Use consistent key formats for all resources (type:id)
- Implement proper error handling for all store operations
- Ensure idempotent operations where appropriate
- Consider performance implications for list operations
- Maintain consistency between in-memory and potential future persistent stores
- Add query capabilities that don't compromise the store abstraction
- Keep storage details isolated from resource manipulation
- Include proper unit tests for all store operations

## Reference Files
@file framework/store/resource-store.ts
@file framework/framework_test.ts 