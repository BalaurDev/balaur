import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { ResourceStore, Resource } from "./mod.ts";

// Import the actual handlers from mcp_server
import {
    handleGetResource,
    handleListResources,
    handleCreateResource,
    handleUpdateResource,
    handleDeleteResource
} from "./mcp_server.ts"; 
// TODO: Potentially import the Zod schema too for more robust invalid data tests

// --- Mocking/Setup ---

// Use an in-memory store for testing
const testStore = new ResourceStore({ kvPath: ":memory:" });

// Helper to clear the store before each test group or individually
async function clearTestStore() {
    // Get all keys under the "resources" prefix
    const kv = await (testStore as any).getKv(); // Access private method for testing cleanup
    const iter = kv.list({ prefix: ["resources"]});
    const promises: Promise<void>[] = [];
    for await(const entry of iter) {
        promises.push(kv.delete(entry.key));
    }
    await Promise.all(promises);
    console.log("Test Store Cleared");
}

// --- Test Suite ---

Deno.test("MCP Server Handlers - Deno KV Integration", async (t) => {

    await t.step("Setup: Clear Store", async () => {
        await clearTestStore();
    });

    let createdResourceJson: any;

    await t.step("handleCreateResource: Should create a new resource", async () => {
        const resourceData = { type: "test", id: "mcp-1", properties: { name: "MCP Test 1" }, state: "created" };
        // Call the actual handler with the test store
        const result = await handleCreateResource(testStore, { resourceData }); 
        assertExists(result);
        assertEquals(result.type, "test");
        assertEquals(result.id, "mcp-1");
        assertEquals((result.properties as any).name, "MCP Test 1");
        assertEquals(result.state, "created");
        createdResourceJson = result; // Save for later tests
    });

     await t.step("handleCreateResource: Should reject invalid data (missing type)", async () => {
        const invalidData = { id: "mcp-invalid", properties: { name: "Invalid" } };
        await assertRejects(
            async () => {
                await handleCreateResource(testStore, { resourceData: invalidData });
            },
            Error, // Expecting a Zod validation error, wrapped in a generic Error
            "Invalid resource data" // Check if message contains expected part
        );
    });

    await t.step("handleGetResource: Should retrieve the created resource", async () => {
        const result = await handleGetResource(testStore, { type: "test", id: "mcp-1" });
        assertExists(result);
        assertEquals(result.id, "mcp-1");
        assertEquals((result.properties as any).name, "MCP Test 1");
    });

    await t.step("handleGetResource: Should return null for non-existent resource", async () => {
        const result = await handleGetResource(testStore, { type: "test", id: "non-existent" });
        assertEquals(result, null);
    });

    await t.step("handleUpdateResource: Should update properties and state", async () => {
        const updateData = { 
            type: "test", 
            id: "mcp-1", 
            properties: { name: "MCP Test Updated", value: 123 }, 
            state: "updated" 
        };
        const result = await handleUpdateResource(testStore, { resourceData: updateData });
        assertExists(result);
        assertEquals(result.id, "mcp-1");
        assertEquals((result.properties as any).name, "MCP Test Updated");
        assertEquals((result.properties as any).value, 123);
        assertEquals(result.state, "updated");

        // Verify with getResource
        const fetched = await handleGetResource(testStore, { type: "test", id: "mcp-1" });
        assertEquals((fetched?.properties as any)?.name, "MCP Test Updated");
        assertEquals(fetched?.state, "updated");
    });

     await t.step("handleListResources: Should list created resources", async () => {
        // Create another resource
        await handleCreateResource(testStore, { resourceData: { type: "test", id: "mcp-2", properties: { name: "MCP Test 2" } } });
        await handleCreateResource(testStore, { resourceData: { type: "other", id: "mcp-other", properties: {} } });

        const listResult = await handleListResources(testStore, { type: "test" });
        assertEquals(listResult.length, 2);
        assertEquals(listResult.some((r: any) => r.id === "mcp-1"), true);
        assertEquals(listResult.some((r: any) => r.id === "mcp-2"), true);
        
        const listOtherResult = await handleListResources(testStore, { type: "other" });
        assertEquals(listOtherResult.length, 1);
        assertEquals(listOtherResult[0].id, "mcp-other");

        const listEmptyResult = await handleListResources(testStore, { type: "non-existent-type" });
        assertEquals(listEmptyResult.length, 0);
    });

    await t.step("handleDeleteResource: Should delete the specified resource", async () => {
        const deleteResult = await handleDeleteResource(testStore, { type: "test", id: "mcp-1" });
        assertEquals(deleteResult.success, true);

        // Verify deletion with getResource
        const fetched = await handleGetResource(testStore, { type: "test", id: "mcp-1" });
        assertEquals(fetched, null);

        // Verify listResources is updated
        const listResult = await handleListResources(testStore, { type: "test" });
        assertEquals(listResult.length, 1); // Only mcp-2 should remain
        assertEquals(listResult[0].id, "mcp-2");
    });

    await t.step("handleDeleteResource: Should return true for non-existent resource (KV delete doesn't error)", async () => {
        // Note: Deno KV kv.delete() doesn't throw if the key doesn't exist.
        // Our handler returns true if no error occurs.
        const deleteResult = await handleDeleteResource(testStore, { type: "test", id: "non-existent" });
        assertEquals(deleteResult.success, true); 
    });

    // TODO: Add more tests for error handling (e.g., invalid input to update)

    await t.step("Teardown: Clear Store and Close KV", async () => {
        await clearTestStore();
        // Close the in-memory KV store connection
        await testStore.close(); 
    });
}); 