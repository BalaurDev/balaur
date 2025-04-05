/**
 * BALAUR Framework Store - Resource Store Implementation
 * Provides storage and retrieval capabilities for resources using an IN-MEMORY MAP
 * (Temporary workaround for Deno KV issue)
 */

import { Resource } from "../core/resource.ts";
// Removed Link import as it's implicitly handled by Resource
// Removed StoredResourceData interface

/**
 * In-memory Map-based implementation of a resource store.
 */
export class ResourceStore {
  // Use a Map for in-memory storage
  private resources: Map<string, Resource> = new Map();

  /**
   * Creates a ResourceStore instance.
   * Constructor takes no arguments for the Map implementation.
   */
  constructor() {
    // No KV initialization needed
    console.warn("ResourceStore: Using in-memory Map implementation (no persistence).");
  }

  // Removed getKv, createKvKey, reconstructResource helpers

  // Helper to create the Map key
  private createMapKey(type: string, id: string): string {
    return `${type}:${id}`;
  }

  /**
   * Creates a new resource in the store
   */
  async createResource(resource: Resource): Promise<void> {
    const key = this.createMapKey(resource.getType(), resource.getId());
    // Store the Resource instance directly
    this.resources.set(key, resource);
    // Return a resolved promise to maintain async signature
    return Promise.resolve(); 
  }

  /**
   * Retrieves a resource by type and ID
   */
  async getResource(type: string, id: string): Promise<Resource | null> {
    const key = this.createMapKey(type, id);
    const resource = this.resources.get(key);
    return Promise.resolve(resource || null);
  }

  /**
   * Updates an existing resource
   */
  async updateResource(resource: Resource): Promise<void> {
     // Map's set operation performs an upsert
     const key = this.createMapKey(resource.getType(), resource.getId());
     this.resources.set(key, resource);
     return Promise.resolve();
  }

  /**
   * Deletes a resource by type and ID
   */
  async deleteResource(type: string, id: string): Promise<boolean> {
    const key = this.createMapKey(type, id);
    const deleted = this.resources.delete(key);
    return Promise.resolve(deleted);
  }

  /**
   * Lists all resources of a specific type
   */
  async listResources(type: string): Promise<Resource[]> {
    const results: Resource[] = [];
    const prefix = `${type}:`;
    for (const [key, resource] of this.resources.entries()) {
      if (key.startsWith(prefix)) {
        results.push(resource);
      }
    }
    return Promise.resolve(results);
  }

  /**
   * Close method (no-op for Map implementation).
   */
  async close(): Promise<void> {
      // No connection to close for Map
      return Promise.resolve();
  }
} 