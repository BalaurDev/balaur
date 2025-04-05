# BALAUR 🐉

**B**ridging **A**I **L**anguage with **A**daptive **U**I **R**epresentations

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Vision

BALAUR is a revolutionary framework for building LLM-powered applications using hypermedia principles. Inspired by the multi-headed dragon from Romanian folklore, BALAUR connects AI language models with interactive user interfaces using modern web standards and minimal JavaScript.

```
 ┌─────────────────────────────────────────┐
 │            BALAUR FRAMEWORK             │
 │  The multi-headed hypermedia for LLMs   │
 └─────────────────────────────────────────┘
            /│\                /│\
           / │ \              / │ \
          /  │  \            /  │  \
 ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
 │  MCP   │ │  HAL   │ │ HTMZ   │ │ Web    │
 │ Tools  │ │ JSON   │ │Updates │ │Compon. │
 └────────┘ └────────┘ └────────┘ └────────┘
       \       |         |        /
        \      |         |       /
         \     |         |      /
          \    |         |     /
         ┌─────────────────────────┐
         │   User Interaction &    │
         │     LLM Navigation      │
         └─────────────────────────┘
```

## Key Features

- 🔄 **HATEOAS-Driven Flow**: Navigate applications through hypermedia controls that LLMs can understand and use
- 🔌 **MCP Integration**: Seamless connection with Claude and other LLMs through the Model Context Protocol
- 📦 **Zero-Bundle JavaScript**: Uses HTMZ for DOM updates without heavy client-side frameworks
- 🧩 **Web Components**: Server-side rendered custom elements with Shadow DOM for style isolation
- 🚀 **Deno-Powered**: Built with Deno 2 for modern TypeScript development with minimal setup
- 📄 **HAL+UI Format**: Extended HAL+JSON format that includes UI component descriptions

## Quick Start

```bash
# Install Deno if you haven't already
curl -fsSL https://deno.land/x/install/install.sh | sh

# Clone the repository
git clone https://github.com/yourusername/balaur.git
cd balaur

# Run the example app
deno task start
```

## Core Concepts

### 1. HAL+UI JSON

BALAUR extends HAL+JSON with a `_components` property that describes UI elements:

```json
{
  "_links": {
    "self": { "href": "/dashboard" },
    "tasks": { "href": "/tasks" }
  },
  "_embedded": {
    "recent_items": [
      { "title": "Task 1", "status": "pending" }
    ]
  },
  "_components": [
    {
      "type": "balaur-nav",
      "target": "#nav",
      "props": { "links": "_links" }
    },
    {
      "type": "balaur-list",
      "target": "#content",
      "props": { "items": "_embedded.recent_items" }
    }
  ]
}
```

### 2. MCP Tools

BALAUR provides standard MCP tools that LLMs can use:

```typescript
server.tool(
  "navigate",
  { path: z.string() },
  async ({ path }) => {
    // Fetch resource and return HAL+UI JSON
  }
);

server.tool(
  "submitForm",
  { 
    form: z.string(),
    data: z.record(z.any())
  },
  async ({ form, data }) => {
    // Process form submission and return result
  }
);
```

### 3. HTMZ Integration

BALAUR uses an enhanced version of HTMZ for lightweight DOM updates:

```html
<!-- A navigation link that updates the content area -->
<a href="/tasks#content" target="htmz">View Tasks</a>

<!-- A form that submits and updates the task list -->
<form action="/tasks/create#task-list" target="htmz">
  <input name="title" placeholder="New task">
  <button>Add Task</button>
</form>
```

### 4. Web Components

Create reusable, encapsulated components:

```typescript
// Define a task component
class BalaurTask extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    const title = this.getAttribute('title');
    const status = this.getAttribute('status');
    
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; margin: 8px 0; }
        .task { border: 1px solid #ccc; padding: 12px; }
        .completed { background: #e8f5e9; }
      </style>
      <div class="task ${status === 'completed' ? 'completed' : ''}">
        <h3>${title}</h3>
        <span>${status}</span>
      </div>
    `;
  }
}

// Register the component
customElements.define('balaur-task', BalaurTask);
```

## Architecture

BALAUR follows a server-centric architecture:

1. **HyperServer**: A Deno-based server that implements the MCP protocol
2. **ResourceRegistry**: Manages HAL+UI resources and their relationships
3. **ComponentRenderer**: Server-side renders web components
4. **MCP Bridge**: Connects LLMs to the hypermedia application

### Server Setup

```typescript
import { serve } from "https://deno.land/std/http/server.ts";
import { Balaur } from "./mod.ts";

const app = new Balaur({
  name: "My App",
  resources: {
    "/dashboard": {
      links: {
        self: { href: "/dashboard" },
        tasks: { href: "/tasks" }
      },
      components: [
        { type: "balaur-header", props: { title: "Dashboard" } },
        { type: "balaur-nav", props: { items: ["Dashboard", "Tasks"] } }
      ]
    }
  }
});

serve(app.handler, { port: 8000 });
```

## LLM Integration

With Claude Desktop or other MCP-compatible clients:

1. Configure your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "balaur-app": {
      "command": "deno",
      "args": ["run", "--allow-net", "/path/to/balaur/server.ts"]
    }
  }
}
```

2. Start a conversation with Claude and it will be able to navigate your application, respond to user requests, and generate UI suggestions based on the available resources.

## Examples

Check out the `/examples` directory for sample applications:

- **Todo App**: A simple task management application
- **Dashboard**: An analytics dashboard with charts and filters
- **Chat**: A messaging interface with conversation history
- **Form Builder**: Dynamic form generation and submission

## Roadmap

- [ ] Core server implementation
- [ ] HAL+UI JSON specification
- [ ] Basic component library
- [ ] MCP tools for navigation
- [ ] Enhanced HTMZ implementation
- [ ] Authentication support
- [ ] Real-time updates via SSE
- [ ] Database integrations
- [ ] Testing utilities

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Named after the Balaur, a multi-headed dragon from Romanian folklore
- Inspired by HATEOAS, HAL, and hypermedia principles
- Built on the Model Context Protocol specification
- Uses concepts from HTMZ for lightweight DOM updates

---

*BALAUR is currently in early development. Star the repo to follow our progress!*