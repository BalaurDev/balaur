import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceStore, Resource } from "./mod.ts";
import { ZodError, z } from "npm:zod@3.24.2"; // Import Zod for validation

// --- Zod Schema (Shared for Resource Input/Validation) ---
const resourceSchema = z.object({
    type: z.string().min(1),
    id: z.string().min(1),
    properties: z.record(z.unknown()).optional(),
    links: z.record(z.object({ href: z.string() })).optional(), 
    state: z.string().optional(),
});

// --- Tool Handlers (Exported for testing, adapted return values) ---

// Takes store as an argument
export async function handleGetResource(store: ResourceStore, params: { type: string; id: string }) {
    console.error(`MCP Server: Handling getResource(${params.type}, ${params.id})`);
    try {
        const resource = await store.getResource(params.type, params.id);
        if (!resource) {
            // Return MCP ToolResult format for not found
            return { content: [{ type: "text" as const, text: `Resource ${params.type}/${params.id} not found.` }], isError: true };
        }
        console.error(`MCP Server: Resource ${params.type}/${params.id} found.`);
        // Wrap result in MCP ToolResult format
        return { content: [{ type: "text" as const, text: JSON.stringify(resource.toJSON(), null, 2) }] }; 
    } catch (error) {
        console.error(`MCP Server: Error in getResource: ${error}`);
        const message = error instanceof Error ? error.message : String(error);
        // Return error in MCP ToolResult format
        return { content: [{ type: "text" as const, text: `Failed to get resource: ${message}` }], isError: true };
    }
}

export async function handleListResources(store: ResourceStore, params: { type: string }) {
    console.error(`MCP Server: Handling listResources(${params.type})`);
    try {
        const resources = await store.listResources(params.type);
        console.error(`MCP Server: Found ${resources.length} resources of type ${params.type}.`);
        // Wrap result in MCP ToolResult format
        return { content: [{ type: "text" as const, text: JSON.stringify(resources.map(r => r.toJSON()), null, 2) }] };
    } catch (error) {
        console.error(`MCP Server: Error in listResources: ${error}`);
        const message = error instanceof Error ? error.message : String(error);
        // Return error in MCP ToolResult format
        return { content: [{ type: "text" as const, text: `Failed to list resources: ${message}` }], isError: true };
    }
}

// Modify handleCreateResource to accept parsed data directly
// Define an inferred type for the parsed data based on resourceSchema
type ParsedResourceData = z.infer<typeof resourceSchema>;

export async function handleCreateResource(store: ResourceStore, parsedData: ParsedResourceData) {
    console.error(`MCP Server: Handling createResource`);
    try {
        // Data is already validated by server.tool using the schema
        // Use parsedData directly
        const newResource = new Resource({
            type: parsedData.type,
            id: parsedData.id,
            properties: parsedData.properties,
            state: parsedData.state,
        });
        if (parsedData.links) {
            for (const [rel, link] of Object.entries(parsedData.links)) {
                newResource.addLink(rel, { href: link.href }); 
            }
        }
        await store.createResource(newResource);
        console.error(`MCP Server: Resource ${parsedData.type}/${parsedData.id} created.`);
        // Wrap result in MCP ToolResult format
        return { content: [{ type: "text" as const, text: JSON.stringify(newResource.toJSON(), null, 2) }] }; 
    } catch (error) {
        // ZodError should ideally be caught by McpServer.tool, but keep check just in case
        console.error(`MCP Server: Error in handleCreateResource: ${error}`);
        let message: string;
        if (error instanceof ZodError) { 
             message = `Invalid resource data passed to handler: ${error.errors.map(e => e.message).join(', ')}`;
        } else {
            message = error instanceof Error ? error.message : String(error);
        }
        // Return error in MCP ToolResult format
        return { content: [{ type: "text" as const, text: `Failed to create resource: ${message}` }], isError: true };
    }
}

// Modify handleUpdateResource to accept parsed data directly
export async function handleUpdateResource(store: ResourceStore, parsedData: ParsedResourceData) {
    console.error(`MCP Server: Handling updateResource`);
     try {
        // Data is already validated by server.tool using the schema
        // Use parsedData directly
        const existingResource = await store.getResource(parsedData.type, parsedData.id);
        if (!existingResource) {
            // Return MCP ToolResult format for not found
            return { content: [{ type: "text" as const, text: `Resource ${parsedData.type}/${parsedData.id} not found for update.` }], isError: true };
        }

        if (parsedData.properties) {
            for (const [key, value] of Object.entries(parsedData.properties)) {
                existingResource.setProperty(key, value);
            }
        }
        if (parsedData.state) existingResource.setState(parsedData.state);
        
        (existingResource as any)._links = {}; 
        if (parsedData.links) {
            for (const [rel, link] of Object.entries(parsedData.links)) {
                existingResource.addLink(rel, { href: link.href });
            }
        }
        
        await store.updateResource(existingResource);
        console.error(`MCP Server: Resource ${parsedData.type}/${parsedData.id} updated.`);
        // Wrap result in MCP ToolResult format
        return { content: [{ type: "text" as const, text: JSON.stringify(existingResource.toJSON(), null, 2) }] }; 
    } catch (error) {
        console.error(`MCP Server: Error in handleUpdateResource: ${error}`);
        let message: string;
        if (error instanceof ZodError) { 
             message = `Invalid resource data passed to handler: ${error.errors.map(e => e.message).join(', ')}`;
        } else {
            message = error instanceof Error ? error.message : String(error);
        }
        // Return error in MCP ToolResult format
        return { content: [{ type: "text" as const, text: `Failed to update resource: ${message}` }], isError: true };
    }
}

export async function handleDeleteResource(store: ResourceStore, params: { type: string; id: string }) {
    console.error(`MCP Server: Handling deleteResource(${params.type}, ${params.id})`);
    try {
        const deleted = await store.deleteResource(params.type, params.id);
        console.error(`MCP Server: Resource ${params.type}/${params.id} deletion result: ${deleted}.`);
        // Return success/failure message in MCP ToolResult format
        const message = deleted ? `Successfully deleted resource ${params.type}/${params.id}.` : `Resource ${params.type}/${params.id} not found or could not be deleted.`;
        return { content: [{ type: "text" as const, text: message }], isError: !deleted }; 
    } catch (error) {
        console.error(`MCP Server: Error in deleteResource: ${error}`);
        const message = error instanceof Error ? error.message : String(error);
        // Return error in MCP ToolResult format
        return { content: [{ type: "text" as const, text: `Failed to delete resource: ${message}` }], isError: true };
    }
}

// --- Main Server Logic (IIFE or similar if run directly) ---

async function main() {
    const store = new ResourceStore(); 
    console.error("MCP Server: Initializing (In-Memory Store)...");

    // --- Server Setup ---
    console.error("MCP Server: Creating McpServer instance...");
    const server = new McpServer({
        name: "BalaurFrameworkServer", 
        version: "0.1.0" // Example version
    });

    // Register tools directly using server.tool(name, zodSchemaShape, handler)
    console.error("MCP Server: Registering tools...");

    server.tool("getResource",
        { type: z.string(), id: z.string() }, // Pass the raw shape object
        (params) => handleGetResource(store, params) 
    );

    server.tool("listResources",
        { type: z.string() }, // Pass the raw shape object
        (params) => handleListResources(store, params)
    );

    // For create/update, the handler expects { resourceData: unknown }
    // The server.tool schema likely defines the structure *within* resourceData
    // Let's assume the SDK flattens the 'resourceData' object for the handler
    // OR maybe the handler needs adjustment? Let's try passing resourceSchema directly
    // This might require handler adjustments later if the SDK passes params differently.
    server.tool("createResource",
        resourceSchema.shape, // Pass the raw shape from the Zod object
        (parsedData) => handleCreateResource(store, parsedData)
    );

     server.tool("updateResource",
        resourceSchema.shape, // Pass the raw shape from the Zod object
        (parsedData) => handleUpdateResource(store, parsedData)
    );

    server.tool("deleteResource",
        { type: z.string(), id: z.string() }, // Pass the raw shape object
        (params) => handleDeleteResource(store, params)
    );

    // --- Transport Setup ---
    console.error("MCP Server: Setting up Stdio transport...");
    // Dynamically import transport to avoid potential top-level await issues if any
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    const transport = new StdioServerTransport();

    Deno.addSignalListener("SIGINT", async () => {
        console.error("\nMCP Server: SIGINT received, closing store...");
        // Consider closing transport if needed? SDK might handle it.
        Deno.exit(0);
    });

    console.error("MCP Server: Connecting server to transport (starting listener)...");
    await server.connect(transport); // McpServer uses connect instead of listen
    
    console.error("MCP Server: Initialization complete. Waiting for client connections via stdio.");
}

// Run main only if the script is executed directly
if (import.meta.main) {
    main().catch(err => {
        console.error("MCP Server: Unhandled error in main:", err);
        Deno.exit(1);
    });
} 