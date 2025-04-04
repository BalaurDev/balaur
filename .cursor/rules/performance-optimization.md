# BALAUR Performance Optimization

This rule provides guidance for performance optimization in the BALAUR framework.

## Description
Performance is a critical aspect of the BALAUR framework, especially for LLM-UI applications.

## Files
*.ts, *.js

## Instructions
- Minimize state changes to reduce unnecessary renders and state transitions
- Use asynchronous operations properly to avoid blocking the main thread
- Implement proper caching mechanisms for resource data 
- Consider using memoization for expensive calculations using built-in functions
- Implement lazy loading for non-critical components and resources
- Optimize resource linking to minimize unnecessary fetches
- Keep payloads small and focused to reduce transmission overhead
- Use appropriate data structures for operations (Maps for lookups, Sets for unique values)
- Avoid deep nesting of resources and links that might cause performance bottlenecks
- Consider the cost of serialization/deserialization in hypermedia exchanges
- Profile and measure performance to identify bottlenecks before optimizing
- Implement request batching when multiple related resources need to be fetched
- Use proper cleanup for resources, event listeners, and subscriptions
- Prioritize critical rendering paths for user interactions
- Consider using web workers for CPU-intensive operations
- Implement pagination or virtualization for large resource collections
- When working with large datasets, implement incremental loading strategies

## Reference Files
@file framework/store/resource-store.ts
@file apps/todo/helpers.ts 