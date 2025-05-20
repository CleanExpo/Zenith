export class SimpleCache {
  private cache: Map<string, { value: any, expires: number, lastAccessed: number }> = new Map();

  public set(key: string, value: any, ttl: number): void {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expires, lastAccessed: Date.now() });
  }

  public get(key: string): any | null {
    const item = this.cache.get(key);
    if (item && item.expires > Date.now()) {
      item.lastAccessed = Date.now();
      return item.value;
    }
    this.cache.delete(key);
    return null;
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public entries(): Iterable<[string, { value: any, expires: number, lastAccessed: number }]> {
    return this.cache.entries();
  }
}
