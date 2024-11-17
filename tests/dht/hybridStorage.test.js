import { HybridStorage } from '../../dht/storage/hybridStorage.js';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('HybridStorage', () => {
  let storage;
  const TEST_DB_PATH = join(process.cwd(), 'test-db');

  beforeEach(async () => {
    storage = new HybridStorage({
      dbPath: TEST_DB_PATH,
      cacheSize: 2, // Small size to test cache eviction
      ttl: 100, // Short TTL to test expiration
    });
  });

  afterEach(async () => {
    await storage.close();
    // Clean up test database
    try {
      await rm(TEST_DB_PATH, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up test database:', error);
    }
  });

  describe('put and get operations', () => {
    it('should store and retrieve values', async () => {
      await storage.put('key1', 'value1');
      const value = await storage.get('key1');
      expect(value).toBe('value1');
    });

    it('should handle complex objects', async () => {
      const complexValue = { foo: 'bar', nums: [1, 2, 3] };
      await storage.put('key2', complexValue);
      const value = await storage.get('key2');
      expect(value).toEqual(complexValue);
    });

    it('should throw on non-existent key', async () => {
      await expect(storage.get('nonexistent')).rejects.toThrow('Key not found: nonexistent');
    });
  });

  describe('cache behavior', () => {
    it('should evict oldest entries when cache is full', async () => {
      // Fill cache
      await storage.put('key1', 'value1');
      await storage.put('key2', 'value2');

      // This should evict key1
      await storage.put('key3', 'value3');

      // key1 should still be in LevelDB
      const value = await storage.get('key1');
      expect(value).toBe('value1');

      // After getting key1, it should be back in cache and key3 should be evicted
      expect(storage.cache.has('key1')).toBe(true); // Now it's back in cache
      expect(storage.cache.has('key2')).toBe(false); // Should be evicted
      expect(storage.cache.has('key3')).toBe(true); // Most recently used before get(key1)
    });
  });

  describe('delete operation', () => {
    it('should remove values from both cache and persistent storage', async () => {
      await storage.put('key1', 'value1');
      await storage.delete('key1');

      // Should be removed from cache
      expect(storage.cache.has('key1')).toBe(false);

      // Should throw when trying to get deleted key
      await expect(storage.get('key1')).rejects.toThrow('Key not found: key1');
    });
  });

  describe('has operation', () => {
    it('should return true for existing keys', async () => {
      await storage.put('key1', 'value1');
      expect(await storage.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', async () => {
      expect(await storage.has('nonexistent')).toBe(false);
    });

    it('should handle expired cache entries', async () => {
      await storage.put('key1', 'value1');

      // Wait for TTL to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should still return true as value exists in LevelDB
      expect(await storage.has('key1')).toBe(true);
    });
  });

  describe('keys operation', () => {
    it('should return all keys', async () => {
      await storage.put('key1', 'value1');
      await storage.put('key2', 'value2');

      const keys = await storage.keys();
      expect(keys).toHaveLength(2);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('should handle empty storage', async () => {
      const keys = await storage.keys();
      expect(keys).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      await storage.close(); // Close DB to force errors

      await expect(storage.put('key1', 'value1')).rejects.toThrow('Failed to store value');

      await expect(storage.get('key1')).rejects.toThrow('Failed to retrieve value');
    });

    it('should require dbPath in constructor', () => {
      // @ts-expect-error - Mocking HybridStorage
      expect(() => new HybridStorage({})).toThrow('dbPath is required for HybridStorage');
    });
  });
});
