/**
 * Todo App - Helper Functions
 * Utility functions for working with task resources
 */

import { Resource, Link } from "../../framework/mod.ts";

/**
 * Creates a new task resource
 */
export function createTask(id: string, title: string, completed = false): Resource {
  const task = new Resource({
    type: "task",
    id,
    properties: {
      title,
      completed,
      createdAt: new Date().toISOString(),
    },
    state: "active",
  });

  // Add self link
  task.addLink("self", {
    href: `/tasks/${id}`,
    method: "GET",
  });

  // Add update link
  task.addLink("update", {
    href: `/tasks/${id}`,
    method: "PUT",
  });

  // Add delete link
  task.addLink("delete", {
    href: `/tasks/${id}`,
    method: "DELETE",
  });

  // Add toggle completion link
  task.addLink("toggle", {
    href: `/tasks/${id}/toggle`,
    method: "POST",
    title: "Toggle completion status",
  });

  return task;
}

/**
 * Creates a collection resource for tasks
 */
export function createTaskCollection(tasks: Resource[]): Resource {
  const collection = new Resource({
    type: "collection",
    id: "tasks",
    properties: {
      count: tasks.length,
    },
  });

  // Add self link
  collection.addLink("self", {
    href: "/tasks",
    method: "GET",
  });

  // Add create link
  collection.addLink("create", {
    href: "/tasks",
    method: "POST",
    title: "Create a new task",
  });

  // Add all tasks as embedded resources
  tasks.forEach(task => {
    collection.addEmbedded("tasks", task);
  });

  return collection;
} 