import { StorageProvider, ResourceStorageOptions } from "./storage-interface.ts";
import { Resource } from "../core/resource.ts";

export class MemoryStore implements StorageProvider<Resource> {
  private store: Map<string, Resource> = new Map();
  private namespace: string;
  
  constructor(options: ResourceStorageOptions = {}) {
    this.namespace = options.namespace || "";
    console.warn("MemoryStore: Using in-memory Map implementation (no persistence).");
  }
  
  async create(key: string, value: Resource): Promise<void> {
    this.store.set(this.namespaceKey(key), value);
  }
  
  async get(key: string): Promise<Resource | null> {
    return this.store.get(this.namespaceKey(key)) || null;
  }
  
  async list(prefix: string): Promise<Resource[]> {
    const nsPrefix = this.namespaceKey(prefix);
    const results: Resource[] = [];
    
    for (const [key, value] of this.store.entries()) {
      if (key.startsWith(nsPrefix)) {
        results.push(value);
      }
    }
    
    return results;
  }
  
  async update(key: string, value: Resource): Promise<void> {
    this.store.set(this.namespaceKey(key), value);
  }
  
  async delete(key: string): Promise<boolean> {
    return this.store.delete(this.namespaceKey(key));
  }
  
  async close(): Promise<void> {
    // Nothing to do for in-memory store
  }
  
  private namespaceKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }
} 