# BALAUR Framework
# A Hypermedia-Driven Framework for LLM-UI Applications

## Table of Contents

1. [Introduction](#introduction)
2. [Core Concepts](#core-concepts)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Guide](#implementation-guide)
   - [Core Module](#core-module)
   - [Store Module](#store-module)
   - [MCP Module](#mcp-module)
   - [Main Entry Point](#main-entry-point)
5. [Resource Definition System](#resource-definition-system)
6. [HATEOAS Implementation](#hateoas-implementation)
7. [Using with Claude Desktop](#using-with-claude-desktop)
8. [Example Applications](#example-applications)
9. [Testing Guide](#testing-guide)
10. [Best Practices](#best-practices)

## Introduction

BALAUR (Bridging AI Language with Adaptive UI Representations) is a modern framework for building hypermedia-driven applications that can be easily consumed by LLMs through the Model Context Protocol (MCP). Named after the multi-headed dragon from Romanian folklore, BALAUR provides a resource-centric approach to application development, allowing LLMs to dynamically generate user interfaces based on self-describing resources.

### Key Features

- **Hypermedia-Driven**: Resources contain links that guide LLMs on possible actions
- **Deno KV Integration**: Native support for Deno's built-in KV database
- **MCP-Ready**: Direct integration with the Model Context Protocol
- **Zero Dependencies**: Built on native Deno capabilities with minimal external requirements
- **Resource-Centric**: Everything is modeled as a resource with consistent representation
- **Self-Documenting**: The API describes itself, making it ideal for LLM interaction
- **HTMZ Compatible**: Designed to work with HTMZ for lightweight DOM updates

### Why BALAUR?

BALAUR addresses the challenge of building applications that can be effectively used by LLMs to generate dynamic user interfaces. By following HATEOAS principles (Hypermedia as the Engine of Application State), BALAUR enables a conversation-driven UI approach where:

1. The LLM requests resources from your application
2. Your application returns resources with embedded links and actions
3. The LLM interprets these resources to generate appropriate UI
4. The user interacts with the UI, triggering state transitions
5. The cycle repeats with updated resources

## Core Concepts

### Resources

Resources are the fundamental units of your application and represent domain entities. Each resource has:

- **Type**: The category of resource (e.g., "task", "user", "project")
- **ID**: A unique identifier
- **Properties**: The data associated with this resource
- **Links**: Hypermedia controls that indicate available actions
- **Embedded Resources**: Related resources contained within this resource

Resources follow the HAL (Hypertext Application Language) format with some extensions for improved LLM understanding.

### Links

Links connect resources and define possible state transitions. Each link has:

- **Relation**: The relationship type (e.g., "self", "edit", "delete", "create")
- **HREF**: The URI or action identifier
- **Method**: The HTTP method or action type
- **Title**: A human-readable description (optional)
- **Templated**: Whether the link contains variable templates (optional)

### Collections

Collections are specialized resources that contain multiple items of the same type. They include:

- **Embedded Resources**: The items in the collection
- **Pagination Controls**: Links for navigating through large collections
- **Filtering Options**: Controls for refining the collection

### State Machine

Resources can have state and transitions between states, forming a state machine. This allows:

- **Predictable Workflows**: Clear paths for resource lifecycle
- **Conditional Actions**: Links that appear only in certain states
- **Business Rule Enforcement**: Preventing invalid state transitions

## Architecture Overview

BALAUR follows a modular architecture with these key components:

```
┌───────────────────────────────────────┐
│            BALAUR Framework           │
└───────────────────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│Resource│  │Store  │  │ MCP   │
│System  │  │System │  │Bridge │
└───┬───┘  └───┬───┘  └───┬───┘
    │          │          │
    └──────────▼──────────┘
               │
         ┌─────▼─────┐
         │  Deno KV  │
         │  Storage  │
         └───────────┘
```

### Resource System

The Resource System handles the creation, manipulation, and serialization of resources. It includes:

- **Resource Class**: Represents a single resource with properties, links, and embedded resources
- **Collection Class**: Specialized resource for containing multiple items
- **HAL Serializer**: Converts resources to HAL+JSON format

### Store System

The Store System provides an abstraction over Deno KV for persisting resources. It handles:

- **CRUD Operations**: Create, read, update, delete operations for resources
- **Querying**: Retrieving resources by ID, type, or custom queries
- **Indexing**: Secondary indexes for efficient lookups
- **Schema Validation**: Ensuring resources conform to defined schemas

### MCP Bridge

The MCP Bridge connects your application to the Model Context Protocol, allowing LLMs like Claude to interact with your resources. It provides:

- **Tool Registration**: Exposing CRUD operations as MCP tools
- **Tool Execution**: Handling tool calls from LLMs
- **Resource Translation**: Converting resources to formats suitable for LLM consumption

## Implementation Guide

This section provides detailed instructions for implementing the BALAUR framework from scratch. Each code block should be copied into the specified file structure.

### Project Structure

Create the following directory structure:

```
/balaur
  /core          # Core resource system
  /store         # Deno KV abstraction
  /mcp           # MCP integration
  mod.ts         # Main entry point
  example.ts     # Example application
```

### Core Module

#### `/core/resource.ts`

Create a `resource.ts` file in the `core` directory with the following content:

```typescript
/**
 * Represents a hypermedia link
 */
export interface Link {
  href: string;
  method?: string;
  title?: string;
  templated?: boolean;
}

/**
 * Represents a hypermedia resource with HATEOAS capabilities
 */
export class Resource {
  private _type: string;
  private _id: string;
  private _properties: Record<string, unknown>;
  private _links: Record<string, Link>;
  private _embedded: Record<string, Resource[]>;
  private _state?: string;

  constructor(config: {
    type: string;
    id: string;
    properties?: Record<string, unknown>;
    links?: Record<string, Link>;
    state?: string;
  }) {
    this._type = config.type;
    this._id = config.id;
    this._properties = config.properties || {};
    this._links = config.links || {};
    this._embedded = {};
    this._state = config.state;
  }

  /**
   * Get the resource type
   */
  getType(): string {
    return this._type;
  }

  /**
   * Get the resource ID
   */
  getId(): string {
    return this._id;
  }

  /**
   * Get the resource state
   */
  getState(): string | undefined {
    return this._state;
  }

  /**
   * Set the resource state
   */
  setState(state: string): Resource {
    this._state = state;
    return this;
  }

  /**
   * Get a property value
   */
  getProperty(name: string): unknown {
    return this._properties[name];
  }

  /**
   * Set a property value
   */
  setProperty(name: string, value: unknown): Resource {
    this._properties[name] = value;
    return this;
  }

  /**
   * Get all properties
   */
  getProperties(): Record<string, unknown> {
    return { ...this._properties };
  }

  /**
   * Add a link to this resource
   */
  addLink(rel: string, href: string, method = "GET", options: Partial<Link> = {}): Resource {
    this._links[rel] = {
      href,
      method,
      ...options
    };
    return this;
  }

  /**
   * Get a link by relation
   */
  getLink(rel: string): Link | undefined {
    return this._links[rel];
  }

  /**
   * Get all links
   */
  getLinks(): Record<string, Link> {
    return { ...this._links };
  }

  /**
   * Embed related resources
   */
  embed(rel: string, resources: Resource | Resource[]): Resource {
    const items = Array.isArray(resources) ? resources : [resources];
    this._embedded[rel] = items;
    return this;
  }

  /**
   * Get embedded resources by relation
   */
  getEmbedded(rel: string): Resource[] | undefined {
    return this._embedded[rel];
  }

  /**
   * Add a state transition link
   */
  addTransition(
    fromState: string,
    toState: string,
    rel: string,
    href: string,
    method = "POST",
    condition?: Record<string, unknown>
  ): Resource {
    // Only add the transition if we're in the correct state
    if (this._state === fromState) {
      // Check condition if provided
      if (condition) {
        let conditionMet = true;
        for (const [key, value] of Object.entries(condition)) {
          if (this._properties[key] !== value) {
            conditionMet = false;
            break;
          }
        }
        if (!conditionMet) return this;
      }

      this.addLink(rel, href, method, { title: `Change state from ${fromState} to ${toState}` });
    }
    return this;
  }

  /**
   * Convert to HAL+JSON representation
   */
  toHAL(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      _type: this._type,
      _id: this._id,
      ...this._properties,
      _links: {}
    };

    if (this._state) {
      result._state = this._state;
    }

    // Add links
    for (const [rel, link] of Object.entries(this._links)) {
      result._links[rel] = link;
    }

    // Add embedded resources
    if (Object.keys(this._embedded).length > 0) {
      result._embedded = {};
      for (const [rel, resources] of Object.entries(this._embedded)) {
        result._embedded[rel] = resources.map(r => r.toHAL());
      }
    }

    return result;
  }
}

/**
 * Represents a collection of resources
 */
export class Collection extends Resource {
  private _items: Resource[] = [];
  private _pagination: {
    page: number;
    pageSize: number;
    total?: number;
  } = { page: 1, pageSize: 10 };

  constructor(config: {
    type: string;
    id?: string;
    items?: Resource[];
    pagination?: {
      page: number;
      pageSize: number;
      total?: number;
    };
  }) {
    super({
      type: `${config.type}Collection`,
      id: config.id || "main",
      properties: {}
    });

    this._items = config.items || [];
    
    if (config.pagination) {
      this._pagination = config.pagination;
      this.setProperty("pagination", this._pagination);
    }

    // Embed items automatically
    this.embed(config.type, this._items);
  }

  /**
   * Add an item to the collection
   */
  addItem(item: Resource): Collection {
    this._items.push(item);
    this.embed(item.getType(), this._items);
    return this;
  }

  /**
   * Add multiple items to the collection
   */
  addItems(items: Resource[]): Collection {
    this._items.push(...items);
    if (items.length > 0) {
      this.embed(items[0].getType(), this._items);
    }
    return this;
  }

  /**
   * Get all items in the collection
   */
  getItems(): Resource[] {
    return [...this._items];
  }

  /**
   * Get the number of items in the collection
   */
  getCount(): number {
    return this._items.length;
  }

  /**
   * Set pagination information
   */
  setPagination(pagination: {
    page: number;
    pageSize: number;
    total?: number;
  }): Collection {
    this._pagination = pagination;
    this.setProperty("pagination", pagination);
    return this;
  }

  /**
   * Add pagination links
   */
  addPaginationLinks(baseUrl: string): Collection {
    const { page, pageSize, total } = this._pagination;
    
    // Self link for current page
    this.addLink("self", `${baseUrl}?page=${page}&pageSize=${pageSize}`);
    
    // First page link
    this.addLink("first", `${baseUrl}?page=1&pageSize=${pageSize}`);
    
    // Previous page link (if not on first page)
    if (page > 1) {
      this.addLink("prev", `${baseUrl}?page=${page - 1}&pageSize=${pageSize}`);
    }
    
    // Next page link (if not on last page and total is known)
    if (total !== undefined && page * pageSize < total) {
      this.addLink("next", `${baseUrl}?page=${page + 1}&pageSize=${pageSize}`);
      
      // Last page link
      const lastPage = Math.ceil(total / pageSize);
      this.addLink("last", `${baseUrl}?page=${lastPage}&pageSize=${pageSize}`);
    }
    
    return this;
  }
}

/**
 * Create a resource instance
 */
export function createResource(config: {
  type: string;
  id: string;
  properties?: Record<string, unknown>;
  links?: Record<string, Link>;
  state?: string;
}): Resource {
  return new Resource(config);
}

/**
 * Create a collection instance
 */
export function createCollection(config: {
  type: string;
  id?: string;
  items?: Resource[];
  pagination?: {
    page: number;
    pageSize: number;
    total?: number;
  };
}): Collection {
  return new Collection(config);
}

// Standard link relations
export const STANDARD_RELS = {
  SELF: "self",
  COLLECTION: "collection",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  NEXT: "next",
  PREV: "prev",
  FIRST: "first",
  LAST: "last",
  UP: "up"
} as const;
```

#### `/core/mod.ts`

Create a `mod.ts` file in the `core` directory to export the resources:

```typescript
export { 
  Resource,
  Collection,
  Link,
  createResource,
  createCollection,
  STANDARD_RELS
} from "./resource.ts";
```

### Store Module

#### `/store/kv.ts`

Create a `kv.ts` file in the `store` directory to abstract Deno KV operations:

```typescript
import { Resource, createResource, createCollection, STANDARD_RELS } from "../core/mod.ts";

/**
 * Key-value store for persisting resources using Deno KV
 */
export class KvStore {
  private kv: Deno.Kv;
  private basePath: string;

  constructor(kv: Deno.Kv, basePath = "") {
    this.kv = kv;
    this.basePath = basePath;
  }

  /**
   * Create a new resource
   */
  async create(
    type: string, 
    data: Record<string, unknown>
  ): Promise<Resource> {
    const id = crypto.randomUUID();
    const key = [this.basePath, type, id];
    
    const resourceData = {
      id,
      ...data,
      createdAt: new Date().toISOString()
    };
    
    await this.kv.set(key, resourceData);
    
    return this.toResource(type, id, resourceData);
  }

  /**
   * Get a resource by ID
   */
  async get(
    type: string, 
    id: string
  ): Promise<Resource | null> {
    const key = [this.basePath, type, id];
    const result = await this.kv.get<Record<string, unknown>>(key);
    
    if (!result.value) return null;
    
    return this.toResource(type, id, result.value);
  }

  /**
   * List resources of a specific type
   */
  async list(
    type: string, 
    options: {
      limit?: number;
      prefix?: string[];
      start?: unknown[];
      end?: unknown[];
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<Resource[]> {
    const prefix = [this.basePath, type];
    if (options.prefix) {
      prefix.push(...options.prefix);
    }
    
    const limit = options.limit ?? (options.page && options.pageSize ? options.pageSize : 100);
    const skip = options.page && options.pageSize ? (options.page - 1) * options.pageSize : 0;
    
    const listOptions: Deno.KvListOptions = { prefix };
    
    if (options.start) {
      listOptions.start = options.start;
    }
    
    if (options.end) {
      listOptions.end = options.end;
    }
    
    const entries = this.kv.list<Record<string, unknown>>(listOptions);
    
    const resources: Resource[] = [];
    let count = 0;
    
    for await (const entry of entries) {
      if (count < skip) {
        count++;
        continue;
      }
      
      if (resources.length >= limit) break;
      
      const resourceId = entry.key[entry.key.length - 1] as string;
      resources.push(this.toResource(type, resourceId, entry.value));
      count++;
    }
    
    return resources;
  }

  /**
   * Get a collection of resources
   */
  async getCollection(
    type: string,
    options: {
      prefix?: string[];
      start?: unknown[];
      end?: unknown[];
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<Collection> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    
    // Get total count for pagination (this could be optimized)
    const prefix = [this.basePath, type];
    if (options.prefix) {
      prefix.push(...options.prefix);
    }
    
    let total = 0;
    const countEntries = this.kv.list<Record<string, unknown>>({ prefix });
    for await (const _ of countEntries) {
      total++;
    }
    
    // Get paginated items
    const resources = await this.list(type, {
      ...options,
      page,
      pageSize
    });
    
    // Create collection with pagination
    const collection = createCollection({
      type,
      items: resources,
      pagination: {
        page,
        pageSize,
        total
      }
    });
    
    // Add standard links
    collection.addLink(STANDARD_RELS.SELF, `/${type}?page=${page}&pageSize=${pageSize}`);
    collection.addLink(STANDARD_RELS.CREATE, `/${type}`, "POST");
    
    // Add pagination links
    const lastPage = Math.ceil(total / pageSize);
    
    collection.addLink(STANDARD_RELS.FIRST, `/${type}?page=1&pageSize=${pageSize}`);
    
    if (page > 1) {
      collection.addLink(STANDARD_RELS.PREV, `/${type}?page=${page - 1}&pageSize=${pageSize}`);
    }
    
    if (page < lastPage) {
      collection.addLink(STANDARD_RELS.NEXT, `/${type}?page=${page + 1}&pageSize=${pageSize}`);
    }
    
    collection.addLink(STANDARD_RELS.LAST, `/${type}?page=${lastPage}&pageSize=${pageSize}`);
    
    return collection;
  }

  /**
   * Update a resource
   */
  async update(
    type: string, 
    id: string, 
    data: Record<string, unknown>
  ): Promise<Resource> {
    const key = [this.basePath, type, id];
    
    // Get existing data
    const result = await this.kv.get<Record<string, unknown>>(key);
    if (!result.value) {
      throw new Error(`Resource ${type}/${id} not found`);
    }
    
    // Merge with new data
    const resourceData = {
      ...result.value,
      ...data,
      id, // Ensure ID is preserved
      updatedAt: new Date().toISOString()
    };
    
    // Update in KV store
    await this.kv.set(key, resourceData);
    
    return this.toResource(type, id, resourceData);
  }

  /**
   * Partially update a resource (only specified fields)
   */
  async patch(
    type: string, 
    id: string, 
    data: Record<string, unknown>
  ): Promise<Resource> {
    return this.update(type, id, data);
  }

  /**
   * Delete a resource
   */
  async delete(type: string, id: string): Promise<void> {
    const key = [this.basePath, type, id];
    await this.kv.delete(key);
  }

  /**
   * Create or update a resource atomically
   */
  async upsert(
    type: string, 
    id: string, 
    data: Record<string, unknown>
  ): Promise<Resource> {
    const key = [this.basePath, type, id];
    const now = new Date().toISOString();
    
    // Get existing data
    const result = await this.kv.get<Record<string, unknown>>(key);
    
    const resourceData = result.value
      ? {
          ...result.value,
          ...data,
          id,
          updatedAt: now
        }
      : {
          ...data,
          id,
          createdAt: now
        };
    
    // Set in KV store
    await this.kv.set(key, resourceData);
    
    return this.toResource(type, id, resourceData);
  }

  /**
   * Convert stored data to a Resource
   */
  private toResource(
    type: string, 
    id: string, 
    data: Record<string, unknown>
  ): Resource {
    // Create base resource
    const resource = createResource({
      type,
      id,
      properties: { ...data },
      state: data.status as string
    });
    
    // Add standard links
    resource.addLink(STANDARD_RELS.SELF, `/${type}/${id}`);
    resource.addLink(STANDARD_RELS.COLLECTION, `/${type}`);
    resource.addLink(STANDARD_RELS.EDIT, `/${type}/${id}`, "PUT");
    resource.addLink(STANDARD_RELS.DELETE, `/${type}/${id}`, "DELETE");
    
    // Add state-specific links
    this.addStateLinks(resource, type, id, data);
    
    return resource;
  }

  /**
   * Add state-specific links to a resource
   */
  private addStateLinks(
    resource: Resource, 
    type: string, 
    id: string, 
    data: Record<string, unknown>
  ): void {
    const state = data.status as string;
    
    // Generic state machine handling
    // This can be customized further based on resource types
    
    if (type === "task") {
      if (state === "pending") {
        resource.addLink("start", `/${type}/${id}/start`, "POST");
      }
      
      if (state === "in-progress") {
        resource.addLink("complete", `/${type}/${id}/complete`, "POST");
        resource.addLink("pause", `/${type}/${id}/pause`, "POST");
      }
      
      if (state === "paused") {
        resource.addLink("resume", `/${type}/${id}/resume`, "POST");
      }
      
      if (state !== "completed" && state !== "cancelled") {
        resource.addLink("cancel", `/${type}/${id}/cancel`, "POST");
      }
    }
  }
}
```

#### `/store/mod.ts`

Create a `mod.ts` file in the `store` directory:

```typescript
export { KvStore } from "./kv.ts";
```

### MCP Module

#### `/mcp/server.ts`

Create a `server.ts` file in the `mcp` directory:

```typescript
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.8.0/server/mcp.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.8.0/server/stdio.js";
import { z } from "npm:zod@3.24.2";
import { KvStore } from "../store/mod.ts";
import { Collection } from "../core/mod.ts";

/**
 * MCP server wrapper for BALAUR
 */
export class BalaurServer {
  private mcp: McpServer;
  private store: KvStore;
  private debug: boolean;

  constructor(kv: Deno.Kv, options: {
    name?: string;
    version?: string;
    debug?: boolean;
  } = {}) {
    this.store = new KvStore(kv);
    this.debug = options.debug || false;
    
    this.mcp = new McpServer({
      name: options.name || "balaur",
      version: options.version || "1.0.0"
    });
    
    this.registerTools();
  }

  /**
   * Register MCP tools
   */
  private registerTools() {
    this.registerResourceTools();
    this.registerCollectionTools();
    this.registerTypeTools();
  }

  /**
   * Register resource-level tools
   */
  private registerResourceTools() {
    // Get a resource
    this.mcp.tool(
      "resource_get",
      {
        type: z.string().describe("The resource type"),
        id: z.string().describe("The resource ID")
      },
      async ({ type, id }) => {
        try {
          const resource = await this.store.get(type, id);
          
          if (!resource) {
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify({
                  error: `Resource ${type}/${id} not found`
                }, null, 2)
              }],
              isError: true
            };
          }
          
          if (this.debug) {
            console.error(`GET ${type}/${id}`);
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(resource.toHAL(), null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                error: `Error retrieving resource: ${error.message}`
              }, null, 2)
            }],
            isError: true
          };
        }
      }
    );

    // Create a resource
    this.mcp.tool(
      "resource_create",
      {
        type: z.string().describe("The resource type"),
        data: z.record(z.any()).describe("The resource data")
      },
      async ({ type, data }) => {
        try {
          const resource = await this.store.create(type, data);
          
          if (this.debug) {
            console.error(`CREATE ${type} ${resource.getId()}`);
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(resource.toHAL(), null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                error: `Error creating resource: ${error.message}`
              }, null, 2)
            }],
            isError: true
          };
        }
      }
    );

    // Update a resource
    this.mcp.tool(
      "resource_update",
      {
        type: z.string().describe("The resource type"),
        id: z.string().describe("The resource ID"),
        data: z.record(z.any()).describe("The updated data")
      },
      async ({ type, id, data }) => {
        try {
          const resource = await this.store.update(type, id, data);
          
          if (this.debug) {
            console.error(`UPDATE ${type}/${id}`);
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(resource.toHAL(), null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                error: `Error updating resource: ${error.message}`
              }, null, 2)
            }],
            isError: true
          };
        }
      }
    );

    // Delete a resource
    this.mcp.tool(
      "resource_delete",
      {
        type: z.string().describe("The resource type"),
        id: z.string().describe("The resource ID")
      },
      async ({ type, id }) => {
        try {
          await this.store.delete(type, id);
          
          if (this.debug) {
            console.error(`DELETE ${type}/${id}`);
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                message: `Resource ${type}/${id} deleted successfully`
              }, null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                error: `Error deleting resource: ${error.message}`
              }, null, 2)
            }],
            isError: true
          };
        }
      }
    );

    // State transition tool
    this.mcp.tool(
      "resource_transition",
      {
        type: z.string().describe("The resource type"),
        id: z.string().describe("The resource ID"),
        action: z.string().describe("The transition action"),
        data: z.record(z.any()).optional().describe("Additional data for the transition")
      },
      async ({ type, id, action, data = {} }) => {
        try {
          // Get current resource
          const resource = await this.store.get(type, id);
          
          if (!resource) {
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify({
                  error: `Resource ${type}/${id} not found`
                }, null, 2)
              }],
              isError: true
            };
          }
          
          // Check if action is available
          const link = resource.getLink(action);
          if (!link) {
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify({
                  error: `Action '${action}' not available for this resource state`
                }, null, 2)
              }],
              isError: true
            };
          }
          
          // Apply the transition
          let newState = "";
          
          // Map actions to states for common cases
          // This can be customized based on your application's state machine
          if (type === "task") {
            switch (action) {
              case "start":
                newState = "in-progress";
                break;
              case "complete":
                newState = "completed";
                break;
              case "pause":
                newState = "paused";
                break;
              case "resume":
                newState = "in-progress";
                break;
              case "cancel":
                newState = "cancelled";
                break;
            }
          }
          
          // Update the resource with new state and additional data
          const updated = await this.store.update(type, id, {
            ...data,
            status: newState || resource.getState(),
            transitionedAt: new Date().toISOString()
          });
          
          if (this.debug) {
            console.error(`TRANSITION ${type}/${id} ${action} -> ${newState}`);
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(updated.toHAL(), null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                error: `Error during state transition: ${error.message}`
              }, null, 2)
            }],
            isError: true
          };
        }
      }
    );
  }

  /**
   * Register collection-level tools
   */
  private registerCollectionTools() {
    // List resources
    this.mcp.tool(
      "collection_list",
      {
        type: z.string().describe("The resource type to list"),
        page: z.number().optional().describe("Page number for pagination"),
        pageSize: z.number().optional().describe("Items per page for pagination"),
        filter: z.record(z.any()).optional().describe("Filter criteria")
      },
      async ({ type, page = 1, pageSize = 10, filter = {} }) => {
        try {
          const collection = await this.store.getCollection(type, {
            page,
            pageSize,
            // Additional filter options could be used here
          });
          
          if (this.debug) {
            console.error(`LIST ${type} (page ${page}, size ${pageSize})`);
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(collection.toHAL(), null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                error: `Error listing resources: ${error.message}`
              }, null, 2)
            }],
            isError: true
          };
        }
      }
    );
  }

  /**
   * Register type-level tools
   */
  private registerTypeTools() {
    // Get application root
    this.mcp.tool(
      "get_root",
      {},
      async () => {
        try {
          // Get a list of available resource types (hardcoded for now)
          // In a real app, this could be dynamically generated
          const availableTypes = ["task", "user", "project"];
          
          const root = {
            _type: "application",
            _id: "root",
            name: "BALAUR Application",
            description: "Hypermedia-driven application",
            _links: {
              self: { href: "/" }
            }
          };
          
          // Add links for each resource type
          for (const type of availableTypes) {
            root._links[type] = { href: `/${type}`, method: "GET" };
            root._links[`create_${type}`] = { href: `/${type}`, method: "POST" };
          }
          
          if (this.debug) {
            console.error(`GET /`);
          }
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(root, null, 2) 
            }]
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify({
                error: `Error getting application root: ${error.message}`
              }, null, 2)
            }],
            isError: true
          };
        }
      }
    );
  }

  /**
   * Start the MCP server
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.mcp.connect(transport);
    console.error("BALAUR server started");
    
    return this.mcp;
  }

  /**
   * Get the MCP server instance
   */
  getMcpServer(): McpServer {
    return this.mcp;
  }

  /**
   * Get the store instance
   */
  getStore(): KvStore {
    return this.store;
  }
}
```

#### `/mcp/mod.ts`

Create a `mod.ts` file in the `mcp` directory:

```typescript
export { BalaurServer } from "./server.ts";
```

### Main Entry Point

#### `/mod.ts`

Create the main module entry point at the root of the project:

```typescript
// Export core components
export { 
  Resource, 
  Collection,
  Link,
  createResource,
  createCollection,
  STANDARD_RELS
} from "./core/mod.ts";

// Export store components
export { KvStore } from "./store/mod.ts";

// Export MCP components
export { BalaurServer } from "./mcp/mod.ts";

/**
 * Create a new BALAUR application
 */
export async function createApp(kvPath?: string, options: {
  name?: string;
  version?: string;
  debug?: boolean;
} = {}) {
  const kv = await Deno.openKv(kvPath);
  const server = new BalaurServer(kv, options);
  await server.start();
  return server;
}
```

## Resource Definition System

BALAUR takes a resource-centric approach to application development. Each domain entity in your application is modeled as a resource with consistent representation and behavior.

When designing your resources, follow these guidelines:

1. **Define Clear Types**: Each resource should have a specific type that represents its domain entity (e.g., "task", "user", "project")
2. **Use Meaningful IDs**: IDs should be unique within a type and preferably UUIDs
3. **Include Essential Properties**: Only include properties that are relevant to the resource
4. **Add Comprehensive Links**: Provide links for all possible actions
5. **Model State Transitions**: Use the state machine features to enforce valid transitions
6. **Use Collections**: Group related resources in collections with proper pagination

### Example Resource Definition

Here's an example of how to define and use resources in a BALAUR application:

```typescript
import { createApp, Resource, createResource } from "./mod.ts";

// Initialize the application
const app = await createApp();
const store = app.getStore();

// Create a task resource
await store.create("task", {
  title: "Implement BALAUR framework",
  description: "Build a hypermedia-driven framework for LLMs",
  assignee: "user123",
  dueDate: "2025-05-01",
  status: "pending",
  priority: "high"
});

// Create a user resource
await store.create("user", {
  username: "johndoe",
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  status: "active"
});
```

## HATEOAS Implementation

BALAUR implements HATEOAS (Hypermedia as the Engine of Application State) principles to create self-describing APIs that guide clients and LLMs through the application's capabilities.

### Key HATEOAS Features

1. **Resource Discovery**: The application root provides links to all available resource types
2. **Link Relations**: Standardized link relations indicate the relationship between resources
3. **State Transitions**: Resources include links to available actions based on their current state
4. **Collections**: Resource collections include pagination links and metadata
5. **Embedded Resources**: Related resources are embedded within containing resources

### Example HAL+JSON Output

Here's an example of a HAL+JSON representation of a task resource:

```json
{
  "_type": "task",
  "_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Implement BALAUR framework",
  "description": "Build a hypermedia-driven framework for LLMs",
  "assignee": "user123",
  "dueDate": "2025-05-01",
  "status": "pending",
  "priority": "high",
  "createdAt": "2024-04-01T12:00:00Z",
  "_state": "pending",
  "_links": {
    "self": {
      "href": "/task/123e4567-e89b-12d3-a456-426614174000",
      "method": "GET"
    },
    "collection": {
      "href": "/task",
      "method": "GET"
    },
    "edit": {
      "href": "/task/123e4567-e89b-12d3-a456-426614174000",
      "method": "PUT"
    },
    "delete": {
      "href": "/task/123e4567-e89b-12d3-a456-426614174000",
      "method": "DELETE"
    },
    "start": {
      "href": "/task/123e4567-e89b-12d3-a456-426614174000/start",
      "method": "POST",
      "title": "Change state from pending to in-progress"
    },
    "cancel": {
      "href": "/task/123e4567-e89b-12d3-a456-426614174000/cancel",
      "method": "POST",
      "title": "Change state from pending to cancelled"
    },
    "assignee": {
      "href": "/user/user123",
      "method": "GET"
    }
  },
  "_embedded": {
    "comments": [
      {
        "_type": "comment",
        "_id": "comment123",
        "text": "This is coming along nicely!",
        "author": "user456",
        "createdAt": "2024-04-02T10:30:00Z",
        "_links": {
          "self": {
            "href": "/comment/comment123",
            "method": "GET"
          }
        }
      }
    ]
  }
}
```

## Using with Claude Desktop

To use your BALAUR application with Claude Desktop, you need to configure Claude to recognize and connect to your MCP server.

### 1. Build Your BALAUR Application

First, create a simple BALAUR application:

```typescript
// app.ts
import { createApp } from "./mod.ts";

// Get KV path from command line args (use ":memory:" for in-memory database)
const DENO_KV_PATH = Deno.args[0] || ":memory:";

// Initialize the application with debug logging enabled
await createApp(DENO_KV_PATH, { debug: true });
```

### 2. Configure Claude Desktop

Edit your Claude Desktop configuration file (located at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "balaur": {
      "command": "deno",
      "args": [
        "run",
        "--allow-net",
        "--allow-read",
        "--allow-write", 
        "--allow-env",
        "--unstable",
        "/path/to/your/app.ts",
        ":memory:"
      ]
    }
  }
}
```

Replace `/path/to/your/app.ts` with the actual path to your application file.

### 3. Interact with Claude

Once configured, restart Claude Desktop and start a conversation. Claude can now interact with your BALAUR application through MCP tools:

1. **Explore the application root**:
   ```
   Can you show me the available resources in my BALAUR application?
   ```

2. **Create a resource**:
   ```
   Create a task titled "Learn BALAUR" with high priority and a due date of next Friday.
   ```

3. **View resources**:
   ```
   Show me all the tasks in the system.
   ```

4. **Update a resource**:
   ```
   Change the status of the "Learn BALAUR" task to "in-progress".
   ```

Claude will use the MCP tools to interact with your BALAUR application and generate appropriate UI representations based on the hypermedia controls in the responses.

## Example Applications

### Task Management Application

Here's a complete example of a task management application built with BALAUR:

```typescript
// task-app.ts
import { createApp } from "./mod.ts";

// Get KV path from command line args
const DENO_KV_PATH = Deno.args[0] || ":memory:";

// Initialize the application
const app = await createApp(DENO_KV_PATH, { 
  name: "TaskManager", 
  version: "1.0.0",
  debug: true 
});

// Get store for initial setup
const store = app.getStore();

// Seed the database with some initial data
async function seedDatabase() {
  console.error("Seeding database...");
  
  // Create sample users
  const user1 = await store.create("user", {
    username: "johndoe",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    status: "active"
  });
  
  const user2 = await store.create("user", {
    username: "janedoe",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Doe",
    status: "active"
  });
  
  // Create sample tasks
  await store.create("task", {
    title: "Implement BALAUR framework",
    description: "Build a hypermedia-driven framework for LLMs",
    assignee: user1.getId(),
    dueDate: "2025-05-01",
    status: "pending",
    priority: "high"
  });
  
  await store.create("task", {
    title: "Write documentation",
    description: "Create comprehensive documentation for BALAUR",
    assignee: user2.getId(),
    dueDate: "2025-05-15",
    status: "pending",
    priority: "medium"
  });
  
  await store.create("task", {
    title: "Build example application",
    description: "Create a demo application using BALAUR",
    assignee: user1.getId(),
    dueDate: "2025-05-30",
    status: "pending",
    priority: "low"
  });
  
  console.error("Database seeded successfully!");
}

// Seed the database
await seedDatabase();

// The app is now running and ready to handle MCP requests
console.error("Task Manager application started");
```

To use this application with Claude Desktop, configure it as described in the previous section.

## Testing Guide

### Unit Testing

You can write unit tests for your BALAUR application using Deno's built-in testing framework:

```typescript
// test.ts
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { Resource, createResource, KvStore } from "./mod.ts";

// Test resource creation
Deno.test("Resource creation", () => {
  const resource = createResource({
    type: "task",
    id: "123",
    properties: {
      title: "Test Task",
      status: "pending"
    }
  });
  
  assertEquals(resource.getType(), "task");
  assertEquals(resource.getId(), "123");
  assertEquals(resource.getProperty("title"), "Test Task");
});

// Test KV store operations
Deno.test("KV store operations", async () => {
  // Create an in-memory KV store for testing
  const kv = await Deno.openKv(":memory:");
  const store = new KvStore(kv);
  
  // Create a resource
  const resource = await store.create("task", {
    title: "Test Task",
    status: "pending"
  });
  
  // Verify it was created
  const id = resource.getId();
  const retrieved = await store.get("task", id);
  
  assertEquals(retrieved?.getProperty("title"), "Test Task");
  
  // Update the resource
  await store.update("task", id, {
    status: "completed"
  });
  
  // Verify it was updated
  const updated = await store.get("task", id);
  assertEquals(updated?.getProperty("status"), "completed");
  
  // Delete the resource
  await store.delete("task", id);
  
  // Verify it was deleted
  const deleted = await store.get("task", id);
  assertEquals(deleted, null);
});
```

Run your tests with:

```bash
deno test --allow-all test.ts
```

### Integration Testing

For testing your BALAUR application with the MCP protocol, you can use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) tool:

```bash
npx @modelcontextprotocol/inspector deno run --allow-all app.ts
```

This will launch an interactive UI that allows you to test your MCP server's tools and view the responses.

## Best Practices

### Resource Design

1. **Clear Type Names**: Use descriptive, singular nouns for resource types
2. **Consistent IDs**: Use UUIDs for resource IDs
3. **Essential Properties**: Include only relevant properties
4. **Meaningful States**: Define clear states for resources
5. **Complete Links**: Provide links for all valid actions
6. **Related Resources**: Use embedding for related resources

### Link Design

1. **Standard Relations**: Use standard relation names when applicable
2. **Descriptive Custom Relations**: Choose clear names for custom relations
3. **Method Specification**: Always specify the HTTP method
4. **Titles for Clarity**: Add titles to explain the purpose of links
5. **Templates for Variables**: Use templates for parameterized links

### State Transitions

1. **Clear State Names**: Use clear, descriptive state names
2. **Complete Transitions**: Define all valid transitions
3. **Conditional Logic**: Use conditions for context-dependent transitions
4. **Error Handling**: Validate transitions before applying them

### Error Handling

1. **Clear Error Messages**: Provide descriptive error messages
2. **Structured Errors**: Use consistent error formats
3. **Validation Errors**: Validate input before processing
4. **Resource Not Found**: Handle missing resources gracefully
5. **State Transition Errors**: Handle invalid transitions appropriately

With these best practices, you'll create a robust, maintainable BALAUR application that works seamlessly with Claude and other LLMs.