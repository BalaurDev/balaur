/**
 * BALAUR Framework Store - Resource Store Implementation
 * Provides storage and retrieval capabilities for resources using Deno KV
 */

import { Resource, Link } from "../core/resource.ts";

// Define the structure stored in KV, using the output of Resource.toJSON()
// Note: This mirrors the output of Resource.toJSON() which uses _links and _embedded
interface StoredResourceData {
  type: string;
  id: string;
  properties: Record<string, unknown>;
  _links: Record<string, Link>; 
  // _embedded?: Record<string, StoredResourceData[]>; // Embedded resources might need careful handling if stored
  state?: string;
}

/**
 * Deno KV-based implementation of a resource store
 */
export class ResourceStore {
  private kv: Promise<Deno.Kv>; // Hold the promise returned by Deno.openKv()

  /**
   * Creates a ResourceStore instance.
   * @param options Optional configuration.
   * @param options.kvPath Path to the Deno KV database file. Defaults to the default path.
   *                       Use ":memory:" for an in-memory store (useful for testing).
   */
  constructor(options?: { kvPath?: string }) {
    // Deno.openKv() is async, store the promise
    this.kv = Deno.openKv(options?.kvPath); 
  }

  // Helper to get the resolved KV instance
  private async getKv(): Promise<Deno.Kv> {
    return this.kv;
  }

  // Helper to create the KV key tuple
  private createKvKey(type: string, id: string): Deno.KvKey {
    // Use a structure like ["resources", type, id]
    return ["resources", type, id];
  }

  // Helper to reconstruct a Resource instance from stored data
  private reconstructResource(data: StoredResourceData): Resource {
      const resource = new Resource({
          type: data.type,
          id: data.id,
          properties: data.properties,
          // Directly use the stored _links object, assuming it matches the Link interface
          links: data._links, 
          state: data.state,
      });
      // Note: Embedded resources reconstruction is not handled here
      return resource;
  }

  /**
   * Creates a new resource in the store
   */
  async createResource(resource: Resource): Promise<void> {
    const kv = await this.getKv();
    const key = this.createKvKey(resource.getType(), resource.getId());
    // Store the JSON representation of the resource
    // Use double assertion to satisfy linter for known structure
    const data = resource.toJSON() as unknown as StoredResourceData;
    await kv.set(key, data);
  }

  /**
   * Retrieves a resource by type and ID
   */
  async getResource(type: string, id: string): Promise<Resource | null> {
    const kv = await this.getKv();
    const key = this.createKvKey(type, id);
    const entry = await kv.get<StoredResourceData>(key);

    if (!entry || entry.value === null) {
      return null;
    }
    
    // Reconstruct the Resource instance from the retrieved data
    return this.reconstructResource(entry.value);
  }

  /**
   * Updates an existing resource
   */
  async updateResource(resource: Resource): Promise<void> {
     // KV's set operation performs an upsert, so it handles creation and update
     await this.createResource(resource);
  }

  /**
   * Deletes a resource by type and ID
   */
  async deleteResource(type: string, id: string): Promise<boolean> {
    const kv = await this.getKv();
    const key = this.createKvKey(type, id);
    try {
        await kv.delete(key);
        // Assuming delete doesn't throw if key doesn't exist, 
        // but we don't have a direct way to confirm deletion success other than lack of error.
        // For simplicity, return true if no error.
        return true;
    } catch (error) {
        console.error(`Error deleting resource ${type}/${id}:`, error);
        return false;
    }
  }

  /**
   * Lists all resources of a specific type
   */
  async listResources(type: string): Promise<Resource[]> {
    const kv = await this.getKv();
    const results: Resource[] = [];
    // Use a prefix list to get all resources of a given type
    const prefix: Deno.KvKey = ["resources", type]; 
    const iter = kv.list<StoredResourceData>({ prefix });

    for await (const entry of iter) {
      if (entry.value) {
         results.push(this.reconstructResource(entry.value));
      }
    }
    return results;
  }

  /**
   * Closes the connection to the Deno KV store.
   * It's good practice to call this when the application shuts down.
   */
  async close(): Promise<void> {
      const kv = await this.getKv();
      kv.close();
  }
} 