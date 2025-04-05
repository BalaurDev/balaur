/**
 * Todo App Tests
 */

import { assertEquals, assertNotEquals } from "@std/assert";
import { createTask, createTaskCollection } from "../helpers.ts";

// Test createTask helper
Deno.test("createTask - Creates properly structured task", () => {
  const task = createTask("test-task", "Test Task");
  
  assertEquals(task.getType(), "task");
  assertEquals(task.getId(), "test-task");
  assertEquals(task.getProperty("title"), "Test Task");
  assertEquals(task.getProperty("completed"), false);
  assertEquals(task.getState(), "active");
  
  // Check links
  assertNotEquals(task.getLink("self"), undefined);
  assertNotEquals(task.getLink("update"), undefined);
  assertNotEquals(task.getLink("delete"), undefined);
  assertNotEquals(task.getLink("toggle"), undefined);
});

// Test createTaskCollection helper
Deno.test("createTaskCollection - Creates a collection with embedded tasks", () => {
  const task1 = createTask("task-1", "Task 1");
  const task2 = createTask("task-2", "Task 2");
  
  const collection = createTaskCollection([task1, task2]);
  
  assertEquals(collection.getType(), "collection");
  assertEquals(collection.getId(), "tasks");
  assertEquals(collection.getProperty("count"), 2);
  
  // Check links
  assertNotEquals(collection.getLink("self"), undefined);
  assertNotEquals(collection.getLink("create"), undefined);
  
  // Check embedded tasks
  const embeddedTasks = collection.getEmbedded("tasks");
  assertEquals(embeddedTasks?.length, 2);
  assertEquals(embeddedTasks?.[0].getId(), "task-1");
  assertEquals(embeddedTasks?.[1].getId(), "task-2");
}); 