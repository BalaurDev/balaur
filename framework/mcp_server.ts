import { McpServer, McpToolResult } from "jsr:@mcp/server";
import { ResourceStore, Resource, StorageConfig, Link } from "./mod.ts";
import { ZodError, z, ZodIssue } from "jsr:@zod/zod@^3.24.2";

// --- Custom Error Classes ---
class ResourceNotFoundError extends Error {
  constructor(type: string, id: string) {
    super(`Resource ${type}/${id} not found.`);
    this.name = 'ResourceNotFoundError';
  }
}

class McpToolExecutionError extends Error {
  constructor(toolName: string, originalError: unknown) {
    const message = originalError instanceof Error ? originalError.message : String(originalError);
    super(`Error executing MCP tool '${toolName}': ${message}`);
    this.name = 'McpToolExecutionError';
    // Optionally store the original error for debugging
    // this.cause = originalError;
  }
}

// --- Zod Schema (Shared for Resource Input/Validation) ---
const linkSchema = z.object({
    href: z.string().url(),
    method: z.string().optional(),
    title: z.string().optional(),
    templated: z.boolean().optional(),
});

const resourceSchema = z.object({
    type: z.string().min(1, "Resource type cannot be empty"),
    id: z.string().min(1, "Resource ID cannot be empty"),
    properties: z.record(z.unknown()).optional(),
    links: z.record(linkSchema).optional(),
    state: z.string().optional(),
});

type ParsedResourceData = z.infer<typeof resourceSchema>;

// --- Tool Handlers (with explicit types and custom errors) ---

/**
 * MCP Tool Handler: Retrieves a resource by type and ID.
 * @param store The resource store instance.
 * @param params Object containing the resource type and ID.
 * @returns A promise resolving to an McpToolResult.
 */
export async function handleGetResource(
    store: ResourceStore,
    params: { type: string; id: string }
): Promise<McpToolResult> {
    console.error(`MCP Server: Handling getResource(${params.type}, ${params.id})`);
    try {
        const resource = await store.getResource(params.type, params.id);
        if (!resource) {
            throw new ResourceNotFoundError(params.type, params.id);
        }
        console.error(`MCP Server: Resource ${params.type}/${params.id} found.`);
        return { content: [{ type: "text", text: JSON.stringify(resource.toJSON(), null, 2) }] };
    } catch (error) {
        console.error(`MCP Server: Error in getResource: ${error}`);
        const toolError = new McpToolExecutionError("getResource", error);
        return { content: [{ type: "text", text: toolError.message }], isError: true };
    }
}

/**
 * MCP Tool Handler: Lists resources of a specific type.
 * @param store The resource store instance.
 * @param params Object containing the resource type.
 * @returns A promise resolving to an McpToolResult.
 */
export async function handleListResources(
    store: ResourceStore,
    params: { type: string }
): Promise<McpToolResult> {
    console.error(`MCP Server: Handling listResources(${params.type})`);
    try {
        const resources = await store.listResources(params.type);
        console.error(`MCP Server: Found ${resources.length} resources of type ${params.type}.`);
        return { content: [{ type: "text", text: JSON.stringify(resources.map(r => r.toJSON()), null, 2) }] };
    } catch (error) {
        console.error(`MCP Server: Error in listResources: ${error}`);
        const toolError = new McpToolExecutionError("listResources", error);
        return { content: [{ type: "text", text: toolError.message }], isError: true };
    }
}

/**
 * MCP Tool Handler: Creates a new resource.
 * @param store The resource store instance.
 * @param parsedData Validated resource data conforming to ParsedResourceData.
 * @returns A promise resolving to an McpToolResult.
 */
export async function handleCreateResource(
    store: ResourceStore,
    parsedData: ParsedResourceData
): Promise<McpToolResult> {
    console.error(`MCP Server: Handling createResource`);
    try {
        // Data is already validated by McpServer.tool using the schema
        const newResource = new Resource({
            type: parsedData.type,
            id: parsedData.id,
            properties: parsedData.properties,
            state: parsedData.state,
        });
        if (parsedData.links) {
            for (const [rel, link] of Object.entries(parsedData.links)) {
                newResource.addLink(rel, link as Link);
            }
        }
        await store.createResource(newResource);
        console.error(`MCP Server: Resource ${parsedData.type}/${parsedData.id} created.`);
        return { content: [{ type: "text", text: JSON.stringify(newResource.toJSON(), null, 2) }] };
    } catch (error) {
        console.error(`MCP Server: Error in handleCreateResource: ${error}`);
         // ZodErrors should be caught by McpServer, this is a fallback.
        let toolError: McpToolExecutionError;
        if (error instanceof ZodError) {
             const message = `Invalid resource data passed to handler: ${error.errors.map((e: ZodIssue) => e.message).join(', ')}`;
             toolError = new McpToolExecutionError("createResource", new Error(message));
        } else {
            toolError = new McpToolExecutionError("createResource", error);
        }
        return { content: [{ type: "text", text: toolError.message }], isError: true };
    }
}

/**
 * MCP Tool Handler: Updates an existing resource.
 * @param store The resource store instance.
 * @param parsedData Validated resource data conforming to ParsedResourceData.
 * @returns A promise resolving to an McpToolResult.
 */
export async function handleUpdateResource(
    store: ResourceStore,
    parsedData: ParsedResourceData
): Promise<McpToolResult> {
    console.error(`MCP Server: Handling updateResource`);
     try {
        // Data is already validated by McpServer.tool using the schema
        const existingResource = await store.getResource(parsedData.type, parsedData.id);
        if (!existingResource) {
             throw new ResourceNotFoundError(parsedData.type, parsedData.id);
        }

        if (parsedData.properties) {
            for (const [key, value] of Object.entries(parsedData.properties)) {
                existingResource.setProperty(key, value);
            }
        }
        if (parsedData.state !== undefined) {
             existingResource.setState(parsedData.state);
        }

        existingResource.clearLinks();
        if (parsedData.links) {
            for (const [rel, link] of Object.entries(parsedData.links)) {
                 existingResource.addLink(rel, link as Link);
            }
        }

        await store.updateResource(existingResource);
        console.error(`MCP Server: Resource ${parsedData.type}/${parsedData.id} updated.`);
        return { content: [{ type: "text", text: JSON.stringify(existingResource.toJSON(), null, 2) }] };
    } catch (error) {
        console.error(`MCP Server: Error in handleUpdateResource: ${error}`);
        // ZodErrors should be caught by McpServer, this is a fallback.
        let toolError: McpToolExecutionError;
        if (error instanceof ZodError) {
             const message = `Invalid resource data passed to handler: ${error.errors.map((e: ZodIssue) => e.message).join(', ')}`;
             toolError = new McpToolExecutionError("updateResource", new Error(message));
        } else {
            toolError = new McpToolExecutionError("updateResource", error);
        }
        return { content: [{ type: "text", text: toolError.message }], isError: true };
    }
}

/**
 * MCP Tool Handler: Deletes a resource by type and ID.
 * @param store The resource store instance.
 * @param params Object containing the resource type and ID.
 * @returns A promise resolving to an McpToolResult.
 */
export async function handleDeleteResource(
    store: ResourceStore,
    params: { type: string; id: string }
): Promise<McpToolResult> {
    console.error(`MCP Server: Handling deleteResource(${params.type}, ${params.id})`);
    try {
        const deleted = await store.deleteResource(params.type, params.id);
        if (!deleted) {
            throw new ResourceNotFoundError(params.type, params.id);
        }
        console.error(`MCP Server: Resource ${params.type}/${params.id} deleted successfully.`);
        const message = `Successfully deleted resource ${params.type}/${params.id}.`;
        return { content: [{ type: "text", text: message }] };
    } catch (error) {
        console.error(`MCP Server: Error in deleteResource: ${error}`);
        const toolError = new McpToolExecutionError("deleteResource", error);
        return { content: [{ type: "text", text: toolError.message }], isError: true };
    }
}

/**
 * Initializes and starts the Balaur MCP Server.
 * Configures storage, registers tools, and connects to the transport layer.
 */
async function main(): Promise<void> {
    // Configure storage (defaulting to in-memory if Deno KV fails)
    let storageConfig: StorageConfig = { type: "deno-kv" };
    let store = new ResourceStore(storageConfig);

    try {
        await store.initialize();
        console.error("MCP Server: Initialized with Deno KV store");
    } catch (error) {
        console.error(`MCP Server: Failed to initialize Deno KV: ${error instanceof Error ? error.message : String(error)}`);
        console.error("MCP Server: Falling back to in-memory store");

        // Re-initialize with memory store
        storageConfig = { type: "memory" };
        store = new ResourceStore(storageConfig);
        await store.initialize();
        console.error("MCP Server: Initialized with In-Memory store.");
    }

    // --- Server Setup ---
    console.error("MCP Server: Creating McpServer instance...");
    const server = new McpServer({
        name: "BalaurFrameworkServer",
        version: "0.1.0"
    });

    // Register tools directly using server.tool(name, zodSchemaShape, handler)
    console.error("MCP Server: Registering tools...");

    server.tool("getResource",
        z.object({ type: z.string(), id: z.string() }).shape,
        (params: { type: string; id: string }) => handleGetResource(store, params)
    );

    server.tool("listResources",
        z.object({ type: z.string() }).shape,
        (params: { type: string }) => handleListResources(store, params)
    );

    server.tool("createResource",
        resourceSchema,
        (parsedData: ParsedResourceData) => handleCreateResource(store, parsedData)
    );

     server.tool("updateResource",
        resourceSchema,
        (parsedData: ParsedResourceData) => handleUpdateResource(store, parsedData)
    );

    server.tool("deleteResource",
        z.object({ type: z.string(), id: z.string() }).shape,
        (params: { type: string; id: string }) => handleDeleteResource(store, params)
    );

    // --- Transport Setup ---
    console.error("MCP Server: Setting up Stdio transport...");
    const { StdioServerTransport } = await import("jsr:@mcp/server/stdio");
    const transport = new StdioServerTransport();

    Deno.addSignalListener("SIGINT", async () => {
        console.error("\nMCP Server: SIGINT received, closing store...");
        await store.close();
        console.error("MCP Server: Store closed. Exiting.");
        Deno.exit(0);
    });

    console.error("MCP Server: Connecting server to transport (starting listener)...");
    await server.connect(transport);

    console.error("MCP Server: Initialization complete. Waiting for client connections via stdio.");
}

// Run main only if the script is executed directly
if (import.meta.main) {
    main().catch(err => {
        console.error("MCP Server: Unhandled error in main:", err);
        Deno.exit(1);
    });
} 