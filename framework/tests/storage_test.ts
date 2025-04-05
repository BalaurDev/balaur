import { assertEquals, assertNotEquals } from "@std/assert";
import { Resource, ResourceStore, MemoryStore, DenoKvStore } from "../mod.ts";

// Test utility to run the same test suite against different storage backends
async function runStorageTests(name: string, storeFactory: () => Promise<ResourceStore>) {
  Deno.test(`${name} - Basic CRUD operations`, async () => {
    const store = await storeFactory();
    try {
      // Create a test resource
      const resource = new Resource({
        type: "test",
        id: "storage-1",
        properties: { value: 42 },
      });
      
      await store.createResource(resource);
      
      // Read
      const retrieved = await store.getResource("test", "storage-1");
      assertEquals(retrieved?.getId(), "storage-1");
      assertEquals(retrieved?.getProperty("value"), 42);
      
      // Update
      retrieved!.setProperty("value", 99);
      await store.updateResource(retrieved!);
      const updated = await store.getResource("test", "storage-1");
      assertEquals(updated?.getProperty("value"), 99);
      
      // Delete
      const deleted = await store.deleteResource("test", "storage-1");
      assertEquals(deleted, true);
      const notFound = await store.getResource("test", "storage-1");
      assertEquals(notFound, null);
    } finally {
      await store.close();
    }
  });
  
  Deno.test(`${name} - Listing resources`, async () => {
    const store = await storeFactory();
    try {
      // Create multiple resources
      await store.createResource(new Resource({ type: "item", id: "item-1" }));
      await store.createResource(new Resource({ type: "item", id: "item-2" }));
      await store.createResource(new Resource({ type: "item", id: "item-3" }));
      await store.createResource(new Resource({ type: "other", id: "other-1" }));
      
      // List by type
      const items = await store.listResources("item");
      assertEquals(items.length, 3);
      
      const others = await store.listResources("other");
      assertEquals(others.length, 1);
      
      // Cleanup
      for (const id of ["item-1", "item-2", "item-3"]) {
        await store.deleteResource("item", id);
      }
      await store.deleteResource("other", "other-1");
    } finally {
      await store.close();
    }
  });
}

// Memory store tests
runStorageTests("MemoryStore", async () => {
  const store = new ResourceStore({ type: "memory" });
  await store.initialize();
  return store;
});

// Deno KV tests (will be skipped if KV is not available)
Deno.test("Check if Deno KV is available", async () => {
  try {
    const kv = await Deno.openKv();
    await kv.close();
    
    // Run Deno KV tests only if available
    await runStorageTests("DenoKvStore", async () => {
      const store = new ResourceStore({ 
        type: "deno-kv",
        // Use a test-specific namespace to avoid conflicts
        namespace: `test-${Date.now()}`
      });
      await store.initialize();
      return store;
    });
  } catch (error) {
    console.warn(`Skipping Deno KV tests: ${error instanceof Error ? error.message : String(error)}`);
  }
}); 