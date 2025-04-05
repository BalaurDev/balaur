# Balaur Framework Architecture (with MCP)

```mermaid
graph TD
    subgraph Client Application
        Client[MCP Client e.g., Claude Desktop]
    end

    subgraph Balaur Framework (Running via Deno)
        MCPServer[MCP Server (mcp_server.ts)]
        ResourceStore[ResourceStore (resource-store.ts)]
        Core[Core Framework (Resource, Link, etc.)]
        DenoKV[(Deno KV)]
    end

    Client -- MCP Protocol --> MCPServer
    MCPServer -- Uses --> ResourceStore
    ResourceStore -- Uses --> Core
    ResourceStore -- Interacts with --> DenoKV{BLOCKED: Deno.openKv Error}

    style DenoKV fill:#f9f,stroke:#333,stroke-width:2px,color:#000
```

**Description:**

*   An external **MCP Client** communicates with the **Balaur Framework** using the Model Context Protocol.
*   The **MCP Server** within the framework receives these requests.
*   The **MCP Server** uses the **ResourceStore** to handle data operations (CRUD, list) requested via MCP tools.
*   The **ResourceStore** utilizes the **Core Framework** components (like `Resource`).
*   The **ResourceStore** is designed to interact with **Deno KV** for persistent storage.
*   **Current Blocker:** The interaction with Deno KV is blocked due to a `TypeError: Deno.openKv is not a function` error, preventing the ResourceStore and consequently the MCP server from functioning correctly. 