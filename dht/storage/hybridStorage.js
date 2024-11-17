/**
 * @fileoverview Hybrid storage implementation combining in-memory cache with LevelDB persistence.
 * @module dht/storage/hybridStorage
 */

import { Level } from 'level';
import { Storage } from './storage.js';

/**
 * Hybrid storage implementation that combines fast in-memory access with persistent LevelDB storage.
 * Uses an LRU cache for frequently accessed items while ensuring data persistence.
 */
export class HybridStorage extends Storage {
  /**
   * Creates a new hybrid storage instance.
   * @param {Object} options - Storage configuration options
   * @param {string} options.dbPath - Path to LevelDB database
   * @param {number} [options.cacheSize=1000] - Maximum number of items to keep in memory cache
   * @param {number} [options.ttl=3600000] - Time to live for cached items in milliseconds (default 1 hour)
   */
  constructor(options) {
    super();

    if (!options?.dbPath) {
      throw new Error('dbPath is required for HybridStorage');
    }

    this.dbPath = options.dbPath;
    this.cacheSize = options.cacheSize || 1000;
    this.ttl = options.ttl || 3600000; // 1 hour default TTL

    // Initialize cache structures
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.lruList = []; // Track LRU order

    // Initialize LevelDB
    this.db = new Level(this.dbPath, {
      valueEncoding: 'json',
    });
    this.isOpen = true;
  }

  /**
   * Verifies the database is open before operations.
   * @private
   * @throws {Error} If database is closed
   */
  verifyDbOpen() {
    if (!this.isOpen) {
      throw new Error('Database is closed');
    }
  }

  /**
   * Adds a key to the cache, maintaining LRU order.
   * @private
   * @param {string} key - The key to add
   * @param {*} value - The value to cache
   */
  addToCache(key, value) {
    // If cache is full and this is a new key
    if (this.cache.size >= this.cacheSize && !this.cache.has(key)) {
      // Get the least recently used key (first item in lruList)
      const lruKey = this.lruList[0];
      if (lruKey) {
        // Remove the LRU item from cache
        this.cache.delete(lruKey);
        this.cacheTimestamps.delete(lruKey);
        this.lruList.shift();
      }
    }

    // Add new entry to cache
    this.cache.set(key, value);
    this.cacheTimestamps.set(key, Date.now());

    // Update LRU order
    const index = this.lruList.indexOf(key);
    if (index > -1) {
      // If key exists, remove it from its current position
      this.lruList.splice(index, 1);
    }
    // Add key to end of list (most recently used)
    this.lruList.push(key);
  }

  /**
   * Stores a value in both cache and persistent storage.
   * @param {string} key - The key to store the value under
   * @param {*} value - The value to store
   * @returns {Promise<void>}
   */
  async put(key, value) {
    try {
      this.verifyDbOpen();
      this.addToCache(key, value);
      await this.db.put(key, value);
    } catch (error) {
      throw new Error(`Failed to store value: ${error.message}`);
    }
  }

  /**
   * Retrieves a value from storage, preferring cache if available.
   * @param {string} key - The key to retrieve
   * @returns {Promise<*>} The stored value
   * @throws {Error} If key not found or retrieval fails
   */
  async get(key) {
    try {
      this.verifyDbOpen();

      // Check cache first
      if (this.cache.has(key)) {
        const timestamp = this.cacheTimestamps.get(key);
        if (Date.now() - timestamp <= this.ttl) {
          // Update LRU order without changing cache size
          const index = this.lruList.indexOf(key);
          if (index > -1) {
            this.lruList.splice(index, 1);
          }
          this.lruList.push(key);
          this.cacheTimestamps.set(key, Date.now());
          return this.cache.get(key);
        }
        // Remove expired entry
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
        const index = this.lruList.indexOf(key);
        if (index > -1) {
          this.lruList.splice(index, 1);
        }
      }

      // Get from LevelDB
      const value = await this.db.get(key);

      // When adding back to cache, we should evict the least recently used item (key3)
      // but keep the second most recently used item (key2)
      if (this.cache.size >= this.cacheSize) {
        const lruKey = this.lruList[0];
        if (lruKey) {
          this.cache.delete(lruKey);
          this.cacheTimestamps.delete(lruKey);
          this.lruList.shift();
        }
      }

      this.cache.set(key, value);
      this.cacheTimestamps.set(key, Date.now());
      this.lruList.push(key);

      return value;
    } catch (error) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        throw new Error(`Key not found: ${key}`);
      }
      throw new Error(`Failed to retrieve value: ${error.message}`);
    }
  }

  /**
   * Removes a value from both cache and persistent storage.
   * @param {string} key - The key to remove
   * @returns {Promise<void>}
   */
  async delete(key) {
    try {
      this.verifyDbOpen();

      // Remove from cache
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      const index = this.lruList.indexOf(key);
      if (index > -1) {
        this.lruList.splice(index, 1);
      }

      // Remove from LevelDB
      await this.db.del(key);
    } catch (error) {
      throw new Error(`Failed to delete value: ${error.message}`);
    }
  }

  /**
   * Checks if a key exists in storage.
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} True if key exists
   */
  async has(key) {
    try {
      this.verifyDbOpen();

      // Check cache first
      if (this.cache.has(key)) {
        const timestamp = this.cacheTimestamps.get(key);
        if (Date.now() - timestamp <= this.ttl) {
          return true;
        }
        // Remove expired entry
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
        const index = this.lruList.indexOf(key);
        if (index > -1) {
          this.lruList.splice(index, 1);
        }
      }

      // Check LevelDB
      await this.db.get(key);
      return true;
    } catch (error) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return false;
      }
      throw new Error(`Failed to check key existence: ${error.message}`);
    }
  }

  /**
   * Returns all keys in storage.
   * @returns {Promise<string[]>} Array of keys
   */
  async keys() {
    try {
      this.verifyDbOpen();

      const keys = [];
      for await (const key of this.db.keys()) {
        keys.push(key);
      }
      return keys;
    } catch (error) {
      throw new Error(`Failed to retrieve keys: ${error.message}`);
    }
  }

  /**
   * Closes the database connection.
   * @returns {Promise<void>}
   */
  async close() {
    try {
      if (this.isOpen) {
        await this.db.close();
        this.isOpen = false;
        this.cache.clear();
        this.cacheTimestamps.clear();
        this.lruList = [];
      }
    } catch (error) {
      throw new Error(`Failed to close database: ${error.message}`);
    }
  }
}
