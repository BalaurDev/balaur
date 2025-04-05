import { Resource } from "../core/resource.ts";
import { StorageProvider } from "./storage-interface.ts";
import { StorageFactory, StorageConfig } from "./storage-factory.ts";

export class ResourceStore {
  private storage!: StorageProvider<Resource>;
  private isInitialized: boolean = false;
  private storageConfig: StorageConfig;
  
  constructor(storageConfig?: StorageConfig) {
    // Default to memory storage if no config provided
    this.storageConfig = storageConfig || { type: "memory" };
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    this.storage = await StorageFactory.createStorage(this.storageConfig);
    this.isInitialized = true;
  }
  
  private createMapKey(type: string, id: string): string {
    return `${type}:${id}`;
  }
  
  async createResource(resource: Resource): Promise<void> {
    await this.ensureInitialized();
    const key = this.createMapKey(resource.getType(), resource.getId());
    await this.storage.create(key, resource);
  }
  
  async getResource(type: string, id: string): Promise<Resource | null> {
    await this.ensureInitialized();
    const key = this.createMapKey(type, id);
    return await this.storage.get(key);
  }
  
  async updateResource(resource: Resource): Promise<void> {
    await this.ensureInitialized();
    const key = this.createMapKey(resource.getType(), resource.getId());
    await this.storage.update(key, resource);
  }
  
  async deleteResource(type: string, id: string): Promise<boolean> {
    await this.ensureInitialized();
    const key = this.createMapKey(type, id);
    return await this.storage.delete(key);
  }
  
  async listResources(type: string): Promise<Resource[]> {
    await this.ensureInitialized();
    const prefix = `${type}:`;
    return await this.storage.list(prefix);
  }
  
  async close(): Promise<void> {
    if (this.isInitialized) {
      await this.storage.close();
      this.isInitialized = false;
    }
  }
  
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
} 