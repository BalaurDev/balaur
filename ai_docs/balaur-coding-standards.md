# BALAUR Coding Standards and Guidelines

This document outlines the coding standards and guidelines for the BALAUR framework, designed specifically for AI-assisted development. These rules aim to create code that is concise yet self-descriptive, maintainable, and compatible with Deno 2's strict validation.

## Core Principles

1. **Self-describing code** over excessive comments
2. **Type safety** as a first-class priority
3. **Consistency** in patterns and practices
4. **Simplicity** over clever solutions
5. **Context optimization** for LLM understanding

## TypeScript Best Practices

### Type Definitions

- ✅ **Use explicit return types** on all functions and methods
  ```typescript
  // Good
  function getResource(id: string): Resource | null { ... }
  
  // Avoid
  function getResource(id: string) { ... }
  ```

- ✅ **Define interfaces for all structural data**
  ```typescript
  // Good
  interface ResourceOptions {
    type: string;
    id: string;
    properties?: Record<string, unknown>;
  }
  
  function createResource(options: ResourceOptions): Resource { ... }
  ```

- ✅ **Use specific types instead of `any`**
  ```typescript
  // Good
  function parseData(data: Record<string, unknown>): void { ... }
  
  // Avoid
  function parseData(data: any): void { ... }
  ```

- ✅ **Use `unknown` instead of `any` when type is truly unknown**
  ```typescript
  // Good
  function processUnknownData(data: unknown): void {
    if (typeof data === 'string') {
      // Now TypeScript knows data is a string
    }
  }
  ```

### Type Safety

- ✅ **Add type guards for runtime safety**
  ```typescript
  // Good
  function isResource(obj: unknown): obj is Resource {
    return obj !== null && 
           typeof obj === 'object' && 
           'type' in obj && 
           'id' in obj;
  }
  ```

- ✅ **Validate data at the boundaries**
  ```typescript
  // Good
  async function handleRequest(req: Request): Promise<Response> {
    try {
      const data = await req.json();
      // Validate data before proceeding
      if (!('type' in data) || typeof data.type !== 'string') {
        return new Response('Invalid type', { status: 400 });
      }
      // Now process the validated data
    } catch (error) {
      return new Response('Invalid JSON', { status: 400 });
    }
  }
  ```

## Code Structure and Style

### Functions

- ✅ **Keep functions small and focused on a single task**
  ```typescript
  // Preferred: Small, focused functions
  function validateResource(resource: Resource): boolean { ... }
  function transformResource(resource: Resource): TransformedResource { ... }
  function saveResource(resource: Resource): Promise<void> { ... }
  
  // Rather than one large function doing everything
  ```

- ✅ **Use descriptive parameter names**
  ```typescript
  // Good
  function createLink(relation: string, href: string, method = "GET"): Link { ... }
  
  // Avoid
  function createLink(r: string, h: string, m = "GET"): Link { ... }
  ```

### Classes

- ✅ **Use private fields for encapsulation**
  ```typescript
  class Resource {
    private _id: string;
    private _properties: Record<string, unknown>;
    
    // Public getters/setters or methods to access these
    public getId(): string {
      return this._id;
    }
  }
  ```

- ✅ **Prefer composition over inheritance**
  ```typescript
  // Good
  class Collection {
    private resources: Resource[];
    // ...methods to manage resources
  }
  
  // Instead of extending Resource for collections
  ```

### Error Handling

- ✅ **Be explicit about error types**
  ```typescript
  class ResourceNotFoundError extends Error {
    constructor(type: string, id: string) {
      super(`Resource ${type}/${id} not found`);
      this.name = 'ResourceNotFoundError';
    }
  }
  
  // Then when using:
  if (!resource) {
    throw new ResourceNotFoundError(type, id);
  }
  ```

- ✅ **Use async/await with try/catch blocks**
  ```typescript
  async function fetchResource(id: string): Promise<Resource> {
    try {
      const result = await store.get(id);
      if (!result) {
        throw new ResourceNotFoundError('resource', id);
      }
      return result;
    } catch (error) {
      // Handle or rethrow with appropriate context
      throw new Error(`Failed to fetch resource: ${error.message}`);
    }
  }
  ```

## Naming Conventions

- ✅ **Use PascalCase for classes, interfaces, and types**
  ```typescript
  class Resource { ... }
  interface ResourceOptions { ... }
  type ResourceId = string;
  ```

- ✅ **Use camelCase for variables, properties, and functions**
  ```typescript
  const resourceData = { ... };
  function createResource() { ... }
  ```

- ✅ **Use UPPER_CASE for constants**
  ```typescript
  const MAX_RESOURCES = 100;
  ```

- ✅ **Use descriptive, unabbreviated names**
  ```typescript
  // Good
  const userResource = createResource('user', userData);
  
  // Avoid
  const usrRes = createResource('user', ud);
  ```

## Comments and Documentation

- ✅ **Document public APIs with JSDoc** (but keep it concise)
  ```typescript
  /**
   * Creates a new resource
   * @param type The resource type
   * @param data The resource data
   * @returns The created resource
   */
  function createResource(type: string, data: Record<string, unknown>): Resource { ... }
  ```

- ✅ **Avoid comments for obvious code**
  ```typescript
  // Avoid unnecessary comments
  // Increment count by 1
  count++;
  ```

- ✅ **Use comments to explain "why", not "what"**
  ```typescript
  // Good
  // We use a Map here instead of an object because we need non-string keys
  const resourceCache = new Map<Resource, CacheEntry>();
  
  // Avoid
  // This is a map of resources to cache entries
  const resourceCache = new Map<Resource, CacheEntry>();
  ```

## Asynchronous Programming

- ✅ **Use async/await over callbacks**
  ```typescript
  // Good
  async function loadResource(id: string): Promise<Resource> {
    const data = await store.get(['resources', id]);
    return createResource('resource', data);
  }
  ```

- ✅ **Return early from functions**
  ```typescript
  async function getResource(id: string): Promise<Resource | null> {
    if (!id) return null;
    
    const resource = await store.get(id);
    if (!resource) return null;
    
    return resource;
  }
  ```

## Deno-Specific Guidelines

- ✅ **Use top-level await where it makes code clearer**
  ```typescript
  // Good - Deno supports top-level await
  const kv = await Deno.openKv();
  const app = new Application(kv);
  
  // Instead of wrapping in an async function
  ```

- ✅ **Use Deno's standard library imports from JSR**
  ```typescript
  // Good
  import { assertEquals } from "@std/assert";
  
  // Avoid legacy URLs
  ```

- ✅ **Use native Deno APIs over npm equivalents when available**
  ```typescript
  // Good
  const text = await Deno.readTextFile("./config.json");
  
  // Instead of using npm fs packages
  ```

## Testing Guidelines

- ✅ **Write tests for public API**
  ```typescript
  Deno.test("Resource creation", () => {
    const resource = createResource("test", { name: "Test" });
    assertEquals(resource.getType(), "test");
    assertEquals(resource.getProperty("name"), "Test");
  });
  ```

- ✅ **Test error cases explicitly**
  ```typescript
  Deno.test("Resource not found", async () => {
    await assertRejects(
      () => store.get("nonexistent"),
      ResourceNotFoundError
    );
  });
  ```

## Performance Considerations

- ✅ **Minimize resource contention in Deno KV operations**
  ```typescript
  // Good - Single operation
  await kv.atomic()
    .check({ key: ["resources", id], versionstamp: null })
    .set(["resources", id], resourceData)
    .commit();
  
  // Instead of separate operations that might conflict
  ```

- ✅ **Avoid unnecessary object creation**
  ```typescript
  // Good - Reuse objects when possible
  function transformData(data: Record<string, unknown>): Record<string, unknown> {
    // Modify the data in place when appropriate
    data.processed = true;
    return data;
  }
  ```

## Specific Anti-patterns to Avoid

- ❌ **Don't use `var`** - use `const` or `let`
- ❌ **Don't use `==`** - always use `===`
- ❌ **Don't use `any` type** without a very good reason
- ❌ **Don't ignore Promise rejections** - handle or propagate errors
- ❌ **Don't use dynamic property access** without type guards
- ❌ **Don't use global variables or singletons** unnecessarily
- ❌ **Don't use complicated regex** without explanation
- ❌ **Don't mix synchronous and asynchronous code** without clear boundaries

## For AI Assistance

When an AI assistant is generating code for the BALAUR framework, it should:

1. **Prioritize readability** over clever solutions
2. **Follow TypeScript best practices** consistently
3. **Use native Deno APIs** wherever possible
4. **Include minimal but sufficient JSDoc comments** for public API
5. **Structure code for easy navigation and understanding**
6. **Handle errors explicitly** with appropriate context
7. **Use descriptive names** that make code self-documenting
8. **Apply appropriate type guards** for runtime safety

Following these guidelines will help create a BALAUR codebase that is maintainable, type-safe, and optimized for both human and AI understanding.
