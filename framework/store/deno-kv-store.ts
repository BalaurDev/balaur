import { StorageProvider, ResourceStorageOptions } from "./storage-interface.ts";
import { Resource } from "../core/resource.ts";

export class DenoKvStore implements StorageProvider<Resource> {
  private kv!: Deno.Kv;
  private namespace: string;
  private isOpen: boolean = false;
  
  constructor(options: ResourceStorageOptions & { path?: string } = {}) {
    this.namespace = options.namespace || "";
  }
  
  async init(path?: string): Promise<void> {
    if (this.isOpen) return;
    
    try {
      this.kv = await Deno.openKv(path);
      this.isOpen = true;
      console.log(`DenoKvStore: Connected to Deno KV${path ? ` at ${path}` : ""}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to open Deno KV: ${errorMessage}`);
    }
  }
  
  async create(key: string, value: Resource): Promise<void> {
    await this.ensureOpen();
    const kvKey = this.buildKey(key);
    const result = await this.kv.set(kvKey, this.serializeResource(value));
    
    if (!result.ok) {
      throw new Error(`Failed to create resource at key ${key}`);
    }
  }
  
  async get(key: string): Promise<Resource | null> {
    await this.ensureOpen();
    const kvKey = this.buildKey(key);
    const result = await this.kv.get(kvKey);
    
    if (!result.value) return null;
    
    return this.deserializeResource(result.value);
  }
  
  async list(prefix: string): Promise<Resource[]> {
    await this.ensureOpen();
    const prefixKey = this.buildKey(prefix);
    const entries = this.kv.list({ prefix: prefixKey });
    const resources: Resource[] = [];
    
    for await (const entry of entries) {
      resources.push(this.deserializeResource(entry.value));
    }
    
    return resources;
  }
  
  async update(key: string, value: Resource): Promise<void> {
    await this.ensureOpen();
    const kvKey = this.buildKey(key);
    const result = await this.kv.set(kvKey, this.serializeResource(value));
    
    if (!result.ok) {
      throw new Error(`Failed to update resource at key ${key}`);
    }
  }
  
  async delete(key: string): Promise<boolean> {
    await this.ensureOpen();
    const kvKey = this.buildKey(key);
    await this.kv.delete(kvKey);
    // Deno KV delete doesn't return a success indicator, so we'll check if it exists
    const exists = await this.get(key);
    return exists === null;
  }
  
  async close(): Promise<void> {
    if (this.isOpen) {
      await this.kv.close();
      this.isOpen = false;
    }
  }
  
  private buildKey(key: string): Deno.KvKey {
    // Split the key on ':' to create a proper KV key array
    const parts = key.split(":");
    if (this.namespace) {
      return [this.namespace, ...parts];
    }
    return parts;
  }
  
  private serializeResource(resource: Resource): Record<string, unknown> {
    return resource.toJSON();
  }
  
  private deserializeResource(data: unknown): Resource {
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid resource data");
    }
    
    const resourceData = data as Record<string, unknown>;
    
    // Reconstruct a Resource object from serialized data
    const resource = new Resource({
      type: resourceData.type as string,
      id: resourceData.id as string,
      properties: resourceData.properties as Record<string, unknown>,
      state: resourceData.state as string | undefined,
    });
    
    // Add links from the serialized data
    const links = resourceData._links as Record<string, unknown> | undefined;
    if (links) {
      for (const [rel, link] of Object.entries(links)) {
        resource.addLink(rel, link as any);
      }
    }
    
    // Restore embedded resources if any
    const embedded = resourceData._embedded as Record<string, unknown[]> | undefined;
    if (embedded) {
      for (const [rel, items] of Object.entries(embedded)) {
        for (const item of items) {
          resource.addEmbedded(rel, this.deserializeResource(item));
        }
      }
    }
    
    return resource;
  }
  
  private async ensureOpen(): Promise<void> {
    if (!this.isOpen) {
      throw new Error("Deno KV store not initialized. Call init() first.");
    }
  }
} 