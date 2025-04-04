# BALAUR Framework

A Hypermedia-Driven Framework for LLM-UI Applications

## Overview

BALAUR (Bridging AI Language with Adaptive UI Representations) is a modern framework for building hypermedia-driven applications that can be easily consumed by LLMs through the Model Context Protocol (MCP). Named after the multi-headed dragon from Romanian folklore, BALAUR provides a resource-centric approach to application development, allowing LLMs to dynamically generate user interfaces based on self-describing resources.

## Project Structure

```
/balaur
  /framework       # Core framework code
    /core          # Core resource system
      resource.ts  # Resource and Link implementations
    /store         # Storage implementations
      resource-store.ts # ResourceStore implementation
    mod.ts         # Main framework exports
    framework_test.ts # Framework tests
  /apps            # Example applications
    /todo          # Todo app example
      app.ts       # Main Todo application
      helpers.ts   # Helper functions
      app_test.ts  # Todo app tests
  deno.json        # Deno configuration
  README.md        # This file
```

## Features

- **Hypermedia-Driven**: Resources contain links that guide LLMs on possible actions
- **Resource-Centric**: Everything is modeled as a resource with consistent representation
- **Self-Documenting**: The API describes itself, making it ideal for LLM interaction
- **HATEOAS Compliant**: Follows hypermedia as the engine of application state principles
- **Minimal Dependencies**: Built with Deno, only requires standard libraries

## Getting Started

### Prerequisites

- [Deno](https://deno.com) v2.0.0 or higher

### Running the Todo Example

```bash
# Run the Todo app
deno task start

# Run in development mode with file watching
deno task dev

# Run tests
deno task test

# Run framework tests only
deno task test:framework

# Run Todo app tests only
deno task test:todo
```

## Creating Your Own App

1. Create a new directory under `/apps`
2. Import framework components from `../../framework/mod.ts`
3. Define your resources and implement your application logic
4. Create a main file that demonstrates your app's functionality

Example:

```typescript
import { Resource, ResourceStore } from "../../framework/mod.ts";

// Create your resources...
const resource = new Resource({
  type: "example",
  id: "example-1",
  properties: {
    name: "Example Resource",
  },
});

// Add links to guide the UI
resource.addLink("self", {
  href: "/examples/example-1",
  method: "GET",
});

// Your application logic...
```

## Key Concepts

### Resources

Resources are the fundamental units of your application and represent domain entities. Each resource has:

- **Type**: The category of resource (e.g., "task", "user", "project")
- **ID**: A unique identifier
- **Properties**: The data associated with this resource
- **Links**: Hypermedia controls that indicate available actions
- **Embedded Resources**: Related resources contained within this resource

### Links

Links connect resources and define possible state transitions. Each link has:

- **Relation**: The relationship type (e.g., "self", "edit", "delete", "create")
- **HREF**: The URI or action identifier
- **Method**: The HTTP method or action type
- **Title**: A human-readable description (optional)
- **Templated**: Whether the link contains variable templates (optional)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.
