import { StorageProvider, ResourceStorageOptions } from "../interface/storage-interface.ts";
import { Resource } from "../../core/resource.ts";
import { MemoryStore } from "../providers/memory-store.ts";

export type StorageType = "memory" | "deno-kv" | "custom";

export interface StorageConfig extends ResourceStorageOptions {
  type: StorageType;
  path?: string;
  customProvider?: StorageProvider<Resource>;
}

export class StorageFactory {
  static async createStorage(config: StorageConfig): Promise<StorageProvider<Resource>> {
    switch (config.type) {
      case "memory":
        return new MemoryStore(config);

      case "custom":
        if (!config.customProvider) {
          throw new Error("Custom storage provider required for type 'custom'");
        }
        return config.customProvider;
        
      default:
        throw new Error(`Unsupported storage type: ${config.type}`);
    }
  }
} 