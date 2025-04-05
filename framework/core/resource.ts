/**
 * BALAUR Framework Core - Resource Implementation
 * Implements the resource model with HATEOAS capabilities
 */

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

  getType(): string {
    return this._type;
  }

  getId(): string {
    return this._id;
  }

  getState(): string | undefined {
    return this._state;
  }

  setState(state: string): void {
    this._state = state;
  }

  getProperty<T>(key: string): T | undefined {
    return this._properties[key] as T | undefined;
  }

  setProperty(key: string, value: unknown): void {
    this._properties[key] = value;
  }

  getProperties(): Record<string, unknown> {
    return { ...this._properties };
  }

  addLink(rel: string, link: Link): void {
    this._links[rel] = link;
  }

  getLink(rel: string): Link | undefined {
    return this._links[rel];
  }

  getLinks(): Record<string, Link> {
    return { ...this._links };
  }

  clearLinks(): void {
    this._links = {};
  }

  addEmbedded(rel: string, resource: Resource): void {
    if (!this._embedded[rel]) {
      this._embedded[rel] = [];
    }
    this._embedded[rel].push(resource);
  }

  getEmbedded(rel: string): Resource[] | undefined {
    return this._embedded[rel];
  }

  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {
      type: this._type,
      id: this._id,
      properties: this._properties,
      _links: this._links,
    };

    if (Object.keys(this._embedded).length > 0) {
      result._embedded = this._embedded;
    }

    if (this._state) {
      result.state = this._state;
    }

    return result;
  }
} 