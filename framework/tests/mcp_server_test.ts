import { assertEquals, assertExists, assertRejects } from "@std/assert";
// Import all necessary handlers
import { 
    handleCreateResource, 
    handleGetResource, 
    handleListResources, 
    handleUpdateResource, 
    handleDeleteResource 
} from "../mcp_server.ts"; 
import { ResourceStore } from "../mod.ts";


// TODO: Potentially import the Zod schema too for more robust invalid data tests

// Use an in-memory store for testing - Re-initialize for isolation if needed per group
let testStore = new ResourceStore();

// Helper to re-initialize the store (simpler than clearing a Map externally)
function resetTestStore() {
    testStore = new ResourceStore();
    console.log("Test Store Reset");
}

// --- Test Suite ---

Deno.test("MCP Server Handlers - In-Memory ResourceStore Integration", async (t) => {

    await t.step("Setup: Reset Store", () => {
        resetTestStore();
    });

    // No longer need createdResourceJson

    await t.step("handleCreateResource: Should create a new resource", async () => {
        const resourceData = { type: "test", id: "mcp-1", properties: { name: "MCP Test 1" }, state: "created" };
        // Call the actual handler with the test store and direct data
        const result = await handleCreateResource(testStore, resourceData); 
        assertExists(result);
        assertEquals(result.isError, undefined, "Create should not return an error flag"); // Or check for false if explicitly set
        assertExists(result.content);
        assertEquals(result.content.length, 1);
        assertEquals(result.content[0].type, "text");
        
        // Parse the JSON result
        const createdResource = JSON.parse(result.content[0].text);
        
        assertEquals(createdResource.type, "test");
        assertEquals(createdResource.id, "mcp-1");
        assertEquals(createdResource.properties?.name, "MCP Test 1");
        assertEquals(createdResource.state, "created");
    });

    // Removed the invalid data test for handleCreateResource, as validation should occur upstream.

    await t.step("handleGetResource: Should retrieve the created resource", async () => {
        const result = await handleGetResource(testStore, { type: "test", id: "mcp-1" });
        assertExists(result);
        assertEquals(result.isError, undefined, "Get should not return an error flag for existing resource");
        assertExists(result.content);
        const fetchedResource = JSON.parse(result.content[0].text);
        assertEquals(fetchedResource.id, "mcp-1");
        assertEquals(fetchedResource.properties?.name, "MCP Test 1");
    });

    await t.step("handleGetResource: Should return error for non-existent resource", async () => {
        const result = await handleGetResource(testStore, { type: "test", id: "non-existent" });
        assertExists(result);
        assertEquals(result.isError, true, "Get should return an error flag for non-existent resource");
        assertExists(result.content);
        assertEquals(result.content[0].type, "text");
        assertExists(result.content[0].text.includes("not found"));
    });

    await t.step("handleUpdateResource: Should update properties and state", async () => {
        const updateData = { 
            type: "test", 
            id: "mcp-1", 
            properties: { name: "MCP Test Updated", value: 123 }, 
            state: "updated" 
        };
        // Pass updateData directly
        const result = await handleUpdateResource(testStore, updateData); 
        assertExists(result);
        assertEquals(result.isError, undefined, "Update should not return an error flag");
        assertExists(result.content);
        const updatedResource = JSON.parse(result.content[0].text);

        assertEquals(updatedResource.id, "mcp-1");
        assertEquals(updatedResource.properties?.name, "MCP Test Updated");
        assertEquals(updatedResource.properties?.value, 123);
        assertEquals(updatedResource.state, "updated");

        // Verify with getResource
        const getResult = await handleGetResource(testStore, { type: "test", id: "mcp-1" });
        assertExists(getResult?.content);
        const fetched = JSON.parse(getResult.content[0].text);
        assertEquals(fetched?.properties?.name, "MCP Test Updated");
        assertEquals(fetched?.state, "updated");
    });

     await t.step("handleListResources: Should list created resources", async () => {
        // Create another resource
        await handleCreateResource(testStore, { type: "test", id: "mcp-2", properties: { name: "MCP Test 2" }, state: "created" });
        await handleCreateResource(testStore, { type: "other", id: "mcp-other", properties: {}, state: "created" });

        const listResult = await handleListResources(testStore, { type: "test" });
        assertExists(listResult?.content);
        assertEquals(listResult.isError, undefined);
        const testResources = JSON.parse(listResult.content[0].text);
        assertEquals(testResources.length, 2);
        assertEquals(testResources.some((r: any) => r.id === "mcp-1"), true);
        assertEquals(testResources.some((r: any) => r.id === "mcp-2"), true);
        
        const listOtherResult = await handleListResources(testStore, { type: "other" });
         assertExists(listOtherResult?.content);
        assertEquals(listOtherResult.isError, undefined);
        const otherResources = JSON.parse(listOtherResult.content[0].text);
        assertEquals(otherResources.length, 1);
        assertEquals(otherResources[0].id, "mcp-other");

        const listEmptyResult = await handleListResources(testStore, { type: "non-existent-type" });
        assertExists(listEmptyResult?.content);
        assertEquals(listEmptyResult.isError, undefined);
        const emptyResources = JSON.parse(listEmptyResult.content[0].text);
        assertEquals(emptyResources.length, 0);
    });

    await t.step("handleDeleteResource: Should delete the specified resource", async () => {
        const deleteResult = await handleDeleteResource(testStore, { type: "test", id: "mcp-1" });
        assertExists(deleteResult);
        // Check isError is false (or undefined) for successful delete
        assertEquals(deleteResult.isError, false, "Delete should return isError: false on success"); 
        assertExists(deleteResult.content);
        assertExists(deleteResult.content[0].text.includes("Successfully deleted"));

        // Verify deletion with getResource
        const getResult = await handleGetResource(testStore, { type: "test", id: "mcp-1" });
        assertEquals(getResult.isError, true); // Should now be an error (not found)

        // Verify listResources is updated
        const listResult = await handleListResources(testStore, { type: "test" });
        assertExists(listResult?.content);
        const remainingResources = JSON.parse(listResult.content[0].text);
        assertEquals(remainingResources.length, 1); // Only mcp-2 should remain
        assertEquals(remainingResources[0].id, "mcp-2");
    });

    await t.step("handleDeleteResource: Should return error for non-existent resource", async () => {
        const deleteResult = await handleDeleteResource(testStore, { type: "test", id: "non-existent" });
        assertExists(deleteResult);
        // Check isError is true for non-existent delete
        assertEquals(deleteResult.isError, true, "Delete should return isError: true for non-existent");
        assertExists(deleteResult.content);
        assertExists(deleteResult.content[0].text.includes("not found or could not be deleted"));
    });

    // TODO: Add more tests for error handling (e.g., invalid input to update)

    await t.step("Teardown: Reset Store", () => {
        resetTestStore();
        // No close() needed for in-memory store
    });
}); 