/**
 * MCP Server for the Todo App
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "npm:zod@3.24.2";

// Import the TodoApp class (adjust path as needed)
// Assuming TodoApp is exported from app.ts or we need to refactor app.ts
// TODO: Ensure TodoApp class is exported from ./app.ts
import { TodoApp } from "./app.ts"; 

// Helper to wrap results in MCP ToolResult format
function createMcpTextResult(text: string, isError = false): { content: { type: "text"; text: string }[]; isError?: boolean } {
    return { content: [{ type: "text" as const, text }], isError: isError || undefined };
}

async function main() {
    // Instantiate the Todo App
    console.error("MCP Todo Server: Initializing TodoApp...");
    const app = new TodoApp();
    // Initialize with sample data if desired (optional)
    // await app.initialize(); 
    console.error("MCP Todo Server: TodoApp initialized (using in-memory store).");

    // --- Server Setup ---
    console.error("MCP Todo Server: Creating McpServer instance...");
    const server = new McpServer({
        name: "BalaurTodoAppServer", 
        version: "0.1.0" 
    });

    // --- Tool Definitions ---
    console.error("MCP Todo Server: Registering tools...");

    // List Todos
    server.tool("list_todos",
        {}, // No parameters
        async () => {
            try {
                const resultJson = await app.getTasks(); // Returns stringified JSON collection
                return createMcpTextResult(resultJson);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                return createMcpTextResult(`Error listing todos: ${message}`, true);
            }
        }
    );

    // Get Todo by ID
    server.tool("get_todo",
        { id: z.string().min(1) }, // Requires ID
        async (params) => {
            try {
                const resultJson = await app.getTask(params.id); // Returns stringified JSON task
                return createMcpTextResult(resultJson);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                return createMcpTextResult(`Error getting todo ${params.id}: ${message}`, true);
            }
        }
    );

    // Add Todo
    server.tool("add_todo",
        { title: z.string().min(1) }, // Requires title
        async (params) => {
            try {
                const resultJson = await app.createTask(params.title); // Returns stringified JSON of new task
                return createMcpTextResult(resultJson);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                return createMcpTextResult(`Error adding todo: ${message}`, true);
            }
        }
    );

    // Toggle Todo Status
    server.tool("toggle_todo",
        { id: z.string().min(1) }, // Requires ID
        async (params) => {
            try {
                const resultJson = await app.toggleTask(params.id); // Returns stringified JSON of updated task
                return createMcpTextResult(resultJson);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                return createMcpTextResult(`Error toggling todo ${params.id}: ${message}`, true);
            }
        }
    );

    // Delete Todo
    server.tool("delete_todo",
        { id: z.string().min(1) }, // Requires ID
        async (params) => {
            try {
                const deleted = await app.deleteTask(params.id);
                const message = deleted ? `Successfully deleted todo ${params.id}.` : `Todo ${params.id} not found or could not be deleted.`;
                return createMcpTextResult(message, !deleted);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                return createMcpTextResult(`Error deleting todo ${params.id}: ${message}`, true);
            }
        }
    );

    // --- Transport Setup ---
    console.error("MCP Todo Server: Setting up Stdio transport...");
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    const transport = new StdioServerTransport();

    // --- Graceful Shutdown ---
    // Only listen for SIGINT on Windows
    Deno.addSignalListener("SIGINT", async () => {
        console.error("\nMCP Todo Server: SIGINT received...");
        // Add any necessary cleanup for TodoApp if needed (e.g., closing store if it were KV)
        Deno.exit(0);
    });

    // --- Connect and Start ---
    console.error("MCP Todo Server: Connecting server to transport (starting listener)...");
    await server.connect(transport); 
    
    console.error("MCP Todo Server: Initialization complete. Waiting for client connections via stdio.");
}

// Run main only if the script is executed directly
if (import.meta.main) {
    main().catch(err => {
        console.error("MCP Todo Server: Unhandled error in main:", err);
        Deno.exit(1);
    });
} 