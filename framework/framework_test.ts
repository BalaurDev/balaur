/**
 * BALAUR Framework Tests
 */

import { assertEquals, assertNotEquals } from "@std/assert";
import { Resource, ResourceStore } from "./mod.ts";

// Tests for Resource class
Deno.test("Resource - Basic properties", () => {
  const resource = new Resource({
    type: "test",
    id: "123",
    properties: { name: "Test Resource" },
  });

  assertEquals(resource.getType(), "test");
  assertEquals(resource.getId(), "123");
  assertEquals(resource.getProperty("name"), "Test Resource");
});

Deno.test("Resource - Links", () => {
  const resource = new Resource({
    type: "test",
    id: "123",
  });

  resource.addLink("self", { href: "/tests/123" });
  assertEquals(resource.getLink("self")?.href, "/tests/123");
});

Deno.test("Resource - Embedded resources", () => {
  const parent = new Resource({
    type: "parent",
    id: "parent-1",
  });

  const child = new Resource({
    type: "child",
    id: "child-1",
  });

  parent.addEmbedded("children", child);
  assertEquals(parent.getEmbedded("children")?.length, 1);
  assertEquals(parent.getEmbedded("children")?.[0].getId(), "child-1");
});

Deno.test("Resource - State management", () => {
  const resource = new Resource({
    type: "stateful",
    id: "state-1",
    state: "initial",
  });

  assertEquals(resource.getState(), "initial");
  resource.setState("processing");
  assertEquals(resource.getState(), "processing");
});

Deno.test("Resource - JSON serialization", () => {
  const resource = new Resource({
    type: "test",
    id: "123",
    properties: { name: "Test Resource" },
  });

  resource.addLink("self", { href: "/tests/123" });
  
  const json = resource.toJSON();
  assertEquals(json.type, "test");
  assertEquals(json.id, "123");
  assertEquals((json.properties as Record<string, unknown>).name, "Test Resource");
});

// Tests for ResourceStore
Deno.test("ResourceStore - CRUD operations", async () => {
  const store = new ResourceStore();
  const resource = new Resource({
    type: "test",
    id: "store-1",
    properties: { value: 42 },
  });

  // Create
  await store.createResource(resource);
  
  // Read
  const retrieved = await store.getResource("test", "store-1");
  assertEquals(retrieved?.getId(), "store-1");
  assertEquals(retrieved?.getProperty("value"), 42);
  
  // Update
  retrieved?.setProperty("value", 99);
  await store.updateResource(retrieved!);
  const updated = await store.getResource("test", "store-1");
  assertEquals(updated?.getProperty("value"), 99);
  
  // Delete
  const deleted = await store.deleteResource("test", "store-1");
  assertEquals(deleted, true);
  const notFound = await store.getResource("test", "store-1");
  assertEquals(notFound, null);
});

Deno.test("ResourceStore - List resources", async () => {
  const store = new ResourceStore();
  
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
}); 