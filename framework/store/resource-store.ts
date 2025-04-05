import { Resource } from "../core/resource.ts";


export class ResourceStore {

  private resources: Map<string, Resource> = new Map();

  constructor() {
    console.warn("ResourceStore: Using in-memory Map implementation (no persistence).");
  }

  private createMapKey(type: string, id: string): string {
    return `${type}:${id}`;
  }

  createResource(resource: Resource): void {
    const key = this.createMapKey(resource.getType(), resource.getId());
    this.resources.set(key, resource);
  }

  getResource(type: string, id: string): Resource | null {
    const key = this.createMapKey(type, id);
    const resource = this.resources.get(key);
    return resource || null;
  }

  updateResource(resource: Resource): void {
     const key = this.createMapKey(resource.getType(), resource.getId());
     this.resources.set(key, resource);
  }

  deleteResource(type: string, id: string): boolean {
    const key = this.createMapKey(type, id);
    const deleted = this.resources.delete(key);
    return deleted;
  }

  listResources(type: string): Resource[] {
    const results: Resource[] = [];
    const prefix = `${type}:`;
    for (const [key, resource] of this.resources.entries()) {
      if (key.startsWith(prefix)) {
        results.push(resource);
      }
    }
    return results;
  }
} 