export interface StorageProvider<T> {
  create(key: string, value: T): Promise<void>;
  get(key: string): Promise<T | null>;
  list(prefix: string): Promise<T[]>;
  update(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  close(): Promise<void>;
}

export interface ResourceStorageOptions {
  namespace?: string;
} 