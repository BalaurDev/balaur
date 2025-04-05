# BALAUR Technical Stack Reference

## Overview

This document outlines the technical stack used in the BALAUR framework, providing a reference for AI assistants and developers working on the project. BALAUR is built with a focus on modern web standards and minimal dependencies.

## Core Technologies

### Deno Runtime

- **Version**: 2.2.5
- **Website**: [https://deno.com](https://deno.com)
- **Documentation**: [https://deno.land/manual](https://deno.land/manual)
- **Description**: A secure JavaScript/TypeScript runtime built on V8, Rust, and Tokio, focused on productivity and security.

### TypeScript

- **Version**: Aligned with Deno 2.2.5 (TypeScript 5.3+)
- **Compiler Options**: Deno's default TypeScript configuration
- **Paradigm**: Object-oriented, functional programming
- **Description**: Strongly typed superset of JavaScript that compiles to plain JavaScript.

## Dependencies

### Deno Standard Library

- **Import Map**: `@std/assert@1` - JSR-based import for assertions
- **Usage**: Testing and validation
- **Documentation**: [https://jsr.io/@std/assert](https://jsr.io/@std/assert)

### Model Context Protocol (MCP)

- **Package**: `npm:@modelcontextprotocol/sdk@1.8.0`
- **Usage**: Integration with LLMs like Claude
- **Documentation**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)

### Zod Schema Validation

- **Package**: `npm:zod@3.24.2`
- **Usage**: Runtime type checking and validation
- **Documentation**: [https://zod.dev](https://zod.dev)

## Development Environment

### deno.json Configuration

```json
{
  "tasks": {
    "dev": "deno run --watch main.ts"
  },
  "imports": {
    "@std/assert": "jsr:@std/assert@1"
  }
}
```

### Development Workflow

- **Hot Reloading**: `deno task dev` launches the application with file watching
- **Testing**: `deno test --allow-all` runs unit tests
- **Building**: No build step required (Deno runs TypeScript directly)
- **Deployment**: Compatible with Deno Deploy for serverless hosting

## Permission Requirements

The BALAUR framework requires the following Deno permissions:

- `--allow-net`: For network operations (when using HTTP)
- `--allow-read`: To read files and access the KV store
- `--allow-write`: To write to the KV store
- `--allow-env`: To access environment variables
- `--unstable`: To use the Deno KV API (currently unstable)

Example launch command:
```bash
deno run --allow-net --allow-read --allow-write --allow-env --unstable main.ts
```

## Deno KV

- **API Status**: Unstable (requires `--unstable` flag)
- **Documentation**: [https://deno.land/manual/runtime/kv](https://deno.land/manual/runtime/kv)
- **Storage Options**: 
  - File-based persistence
  - In-memory database (`:memory:`)
  - Deno Deploy (production)

## Architecture Constraints

- **No External Runtime Dependencies**: Only native Deno APIs and minimal npm packages
- **Web Standards Focused**: Follows modern web standards and APIs
- **Resource-Centric Design**: Everything is modeled as a hypermedia resource
- **Self-Contained**: All components packaged within the framework
- **HATEOAS Compliant**: Strict adherence to hypermedia principles

## Compatibility

- **Deno Versions**: 2.0.0 and above
- **Client Requirements**: MCP-compatible clients (Claude Desktop, etc.)
- **Browser Support**: N/A (server-side only)
- **IDE Support**: VS Code with Deno extension recommended

## Version History

- **Current Version**: 1.0.0 (Initial Release)
- **Release Date**: April 2025
- **License**: Apache 2.0

## Notes for AI Assistants

When generating code for the BALAUR framework:

1. Use Deno 2.2.5 specific syntax and APIs
2. Leverage Deno KV for data persistence (with appropriate error handling)
3. Follow the resource-based architecture defined in the documentation
4. Import dependencies exactly as specified in this document
5. Ensure code is compatible with MCP integration
6. Apply HATEOAS principles consistently
7. Include appropriate JSDoc comments for all public APIs
8. Follow TypeScript best practices with proper typing

## Related Resources

- [BALAUR Framework Documentation](https://link-to-main-docs)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Deno KV Documentation](https://deno.land/manual/runtime/kv)
- [HATEOAS Principles](https://en.wikipedia.org/wiki/HATEOAS)
