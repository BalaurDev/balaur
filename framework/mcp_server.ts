import { McpServer, ResourceTemplate } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk/server/stdio.js";
import { ResourceStore, Resource } from "./mod.ts";
import { ZodError, z } from "npm:zod@3.24.2"; // Import Zod for validation

// --- Zod Schema (can be shared) ---
const resourceSchema = z.object({
    type: z.string().min(1),
    id: z.string().min(1),
    properties: z.record(z.unknown()).optional(),
    links: z.record(z.object({ href: z.string() })).optional(), 
    state: z.string().optional(),
});

// --- Tool Handlers (Exported for testing) ---

// Takes store as an argument
export async function handleGetResource(store: ResourceStore, params: { type: string; id: string }) {
    console.error(`MCP Server: Handling getResource(${params.type}, ${params.id})`);
    try {
        const resource = await store.getResource(params.type, params.id);
        if (!resource) {
            console.error(`MCP Server: Resource ${params.type}/${params.id} not found.`);
            return null; 
        }
        console.error(`MCP Server: Resource ${params.type}/${params.id} found.`);
        return resource.toJSON();
    } catch (error) {
        console.error(`MCP Server: Error in getResource: ${error}`);
        const message = error instanceof Error ? error.message : String(error);
        // TODO: Improve error reporting for MCP
        throw new Error(`Failed to get resource: ${message}`);
    }
}

export async function handleListResources(store: ResourceStore, params: { type: string }) {
    console.error(`MCP Server: Handling listResources(${params.type})`);
    try {
        const resources = await store.listResources(params.type);
        console.error(`MCP Server: Found ${resources.length} resources of type ${params.type}.`);
        return resources.map(r => r.toJSON());
    } catch (error) {
        console.error(`MCP Server: Error in listResources: ${error}`);
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to list resources: ${message}`);
    }
}

export async function handleCreateResource(store: ResourceStore, params: { resourceData: unknown }) {
    console.error(`MCP Server: Handling createResource`);
    try {
        const validatedData = resourceSchema.parse(params.resourceData);
        const newResource = new Resource({
            type: validatedData.type,
            id: validatedData.id,
            properties: validatedData.properties,
            state: validatedData.state,
        });
        if (validatedData.links) {
            for (const [rel, link] of Object.entries(validatedData.links)) {
                newResource.addLink(rel, { href: link.href }); 
            }
        }
        await store.createResource(newResource);
        console.error(`MCP Server: Resource ${validatedData.type}/${validatedData.id} created.`);
        return newResource.toJSON();
    } catch (error) {
        console.error(`MCP Server: Error in createResource: ${error}`);
        if (error instanceof ZodError) {
             throw new Error(`Invalid resource data: ${error.errors.map(e => e.message).join(', ')}`);
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to create resource: ${message}`);
    }
}

export async function handleUpdateResource(store: ResourceStore, params: { resourceData: unknown }) {
    console.error(`MCP Server: Handling updateResource`);
     try {
        const validatedData = resourceSchema.parse(params.resourceData);
        const existingResource = await store.getResource(validatedData.type, validatedData.id);
        if (!existingResource) {
            throw new Error(`Resource ${validatedData.type}/${validatedData.id} not found for update.`);
        }

        if (validatedData.properties) {
            for (const [key, value] of Object.entries(validatedData.properties)) {
                existingResource.setProperty(key, value);
            }
        }
        if (validatedData.state) existingResource.setState(validatedData.state);
        
        (existingResource as any)._links = {}; 
        if (validatedData.links) {
            for (const [rel, link] of Object.entries(validatedData.links)) {
                existingResource.addLink(rel, { href: link.href });
            }
        }
        
        await store.updateResource(existingResource);
        console.error(`MCP Server: Resource ${validatedData.type}/${validatedData.id} updated.`);
        return existingResource.toJSON();
    } catch (error) {
        console.error(`MCP Server: Error in updateResource: ${error}`);
         if (error instanceof ZodError) {
             throw new Error(`Invalid resource data: ${error.errors.map(e => e.message).join(', ')}`);
        }
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to update resource: ${message}`);
    }
}

export async function handleDeleteResource(store: ResourceStore, params: { type: string; id: string }) {
    console.error(`MCP Server: Handling deleteResource(${params.type}, ${params.id})`);
    try {
        const deleted = await store.deleteResource(params.type, params.id);
        console.error(`MCP Server: Resource ${params.type}/${params.id} deletion result: ${deleted}.`);
        return { success: deleted };
    } catch (error) {
        console.error(`MCP Server: Error in deleteResource: ${error}`);
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to delete resource: ${message}`);
    }
}

// --- Main Server Logic (IIFE or similar if run directly) ---

async function main() {
    // Instantiate the resource store (using default Deno KV path)
    const store = new ResourceStore();
    console.error("MCP Server: Initializing with default KV store...");

    // --- Tool Definitions ---
    const typeParam: ToolParameter = { name: "type", type: "string", description: "The type of the resource" };
    const idParam: ToolParameter = { name: "id", type: "string", description: "The unique ID of the resource" };

    const getResourceTool: ToolDefinition = {
        name: "getResource",
        description: "Retrieves a specific resource by type and ID",
        parameters: [typeParam, idParam],
        // Pass the store instance to the handler, type params
        handler: (params: Record<string, unknown>) => handleGetResource(store, params as { type: string; id: string }), 
    };

    const listResourcesTool: ToolDefinition = {
        name: "listResources",
        description: "Lists all resources of a specific type",
        parameters: [typeParam],
        handler: (params: Record<string, unknown>) => handleListResources(store, params as { type: string }),
    };

    const createResourceTool: ToolDefinition = {
        name: "createResource",
        description: "Creates a new resource",
        parameters: [
            { name: "resourceData", type: "object", description: "The JSON representation of the resource to create" },
        ],
        handler: (params: Record<string, unknown>) => handleCreateResource(store, params as { resourceData: unknown }),
    };

    const updateResourceTool: ToolDefinition = {
        name: "updateResource",
        description: "Updates an existing resource",
        parameters: [
            { name: "resourceData", type: "object", description: "The JSON representation of the resource with updates" },
        ],
         handler: (params: Record<string, unknown>) => handleUpdateResource(store, params as { resourceData: unknown }),
    };

    const deleteResourceTool: ToolDefinition = {
        name: "deleteResource",
        description: "Deletes a specific resource by type and ID",
        parameters: [typeParam, idParam],
        handler: (params: Record<string, unknown>) => handleDeleteResource(store, params as { type: string; id: string }),
    };

    // --- Server Setup ---
    console.error("MCP Server: Creating server instance...");
    const server = new Server({
        // Potential server config 
    });

    server.addTool(getResourceTool);
    server.addTool(listResourcesTool);
    server.addTool(createResourceTool);
    server.addTool(updateResourceTool);
    server.addTool(deleteResourceTool);

    // Graceful shutdown handling
    Deno.addSignalListener("SIGINT", async () => {
        console.error("\nMCP Server: SIGINT received, closing KV store...");
        await store.close();
        Deno.exit(0);
    });
     Deno.addSignalListener("SIGTERM", async () => {
        console.error("MCP Server: SIGTERM received, closing KV store...");
        await store.close();
        Deno.exit(0);
    });

    console.error("MCP Server: Starting listener...");
    server.listen(); 
    console.error("MCP Server: Initialization complete. Waiting for client connections.");
}

// Run main only if the script is executed directly
if (import.meta.main) {
    main().catch(err => {
        console.error("MCP Server: Unhandled error in main:", err);
        Deno.exit(1);
    });
} 