/**
 * Todo App - Main Application
 * A simple Todo application built with the BALAUR framework
 */

import { ResourceStore, VERSION } from "../../framework/mod.ts";
import { createTask, createTaskCollection } from "./helpers.ts";

// Export the class
export class TodoApp {
  private store: ResourceStore;

  constructor() {
    this.store = new ResourceStore();
  }

  /**
   * Initializes the app with sample data
   */
  async initialize(): Promise<void> {
    // Create sample tasks
    await this.store.createResource(createTask("task-1", "Learn BALAUR framework"));
    await this.store.createResource(createTask("task-2", "Build a hypermedia app"));
    await this.store.createResource(createTask("task-3", "Integrate with Claude", true));
  }

  /**
   * Gets all tasks
   */
  async getTasks(): Promise<string> {
    const tasks = await this.store.listResources("task");
    const collection = createTaskCollection(tasks);
    return JSON.stringify(collection.toJSON(), null, 2);
  }

  /**
   * Gets a specific task
   */
  async getTask(id: string): Promise<string> {
    const task = await this.store.getResource("task", id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }
    return JSON.stringify(task.toJSON(), null, 2);
  }

  /**
   * Creates a new task
   */
  async createTask(title: string): Promise<string> {
    const id = `task-${Date.now()}`;
    const task = createTask(id, title);
    await this.store.createResource(task);
    return JSON.stringify(task.toJSON(), null, 2);
  }

  /**
   * Toggles a task's completion status
   */
  async toggleTask(id: string): Promise<string> {
    const task = await this.store.getResource("task", id);
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }
    
    const isCompleted = task.getProperty<boolean>("completed");
    task.setProperty("completed", !isCompleted);
    
    if (!isCompleted) {
      task.setState("completed");
    } else {
      task.setState("active");
    }
    
    await this.store.updateResource(task);
    return JSON.stringify(task.toJSON(), null, 2);
  }

  /**
   * Deletes a task
   */
  async deleteTask(id: string): Promise<boolean> {
    return await this.store.deleteResource("task", id);
  }
}

/**
 * Application entry point
 */
async function main() {
  console.log(`BALAUR Todo App (Framework v${VERSION})`);
  
  // Initialize app
  const app = new TodoApp();
  await app.initialize();
  
  // Demo operations
  console.log("\n=== All Tasks ===");
  console.log(await app.getTasks());
  
  console.log("\n=== Single Task ===");
  console.log(await app.getTask("task-1"));
  
  console.log("\n=== Toggle Task ===");
  console.log(await app.toggleTask("task-1"));
  
  console.log("\n=== Create Task ===");
  console.log(await app.createTask("Implement MCP integration"));
  
  console.log("\n=== Delete Task ===");
  const deleted = await app.deleteTask("task-2");
  console.log(`Task deleted: ${deleted}`);
  
  console.log("\n=== Updated Task List ===");
  console.log(await app.getTasks());
}

// Run app if executed directly
if (import.meta.main) {
  await main();
} 