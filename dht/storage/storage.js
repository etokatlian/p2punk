/**
 * @fileoverview Abstract class for storage implementations.
 * @module storage/storage
 */

/**
 * Abstract class representing a storage implementation for the DHT.
 */
export class Storage {
  /**
   * Creates a new Storage instance.
   */
  constructor() {
    if (new.target === Storage) {
      throw new TypeError('Cannot instantiate Storage directly');
    }
  }

  /**
   * Retrieves a value from storage based on the given key.
   * @param {string} key - The key to look up in storage
   * @returns {Promise<*>} The value associated with the key
   * @throws {Error} If the operation fails or is not implemented
   */
  // eslint-disable-next-line no-unused-vars
  async get(key) {
    throw new Error(`${this.get.name} not implemented`);
  }

  /**
   * Stores a value in storage for the given key.
   * @param {string} key - The key to store
   * @param {*} value - The value to store
   * @returns {Promise<void>}
   * @throws {Error} If the operation fails or is not implemented
   */
  // eslint-disable-next-line no-unused-vars
  async put(key, value) {
    throw new Error(`${this.put.name} not implemented`);
  }

  /**
   * Deletes a value from storage.
   * @param {string} key - The key to delete
   * @returns {Promise<void>}
   * @throws {Error} If the operation fails or is not implemented
   */
  // eslint-disable-next-line no-unused-vars
  async delete(key) {
    throw new Error(`${this.delete.name} not implemented`);
  }

  /**
   * Checks if a key exists in storage.
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} True if the key exists
   * @throws {Error} If the operation fails or is not implemented
   */
  // eslint-disable-next-line no-unused-vars
  async has(key) {
    throw new Error(`${this.has.name} not implemented`);
  }

  /**
   * Returns all keys in storage.
   * @returns {Promise<string[]>} Array of keys
   * @throws {Error} If the operation fails or is not implemented
   */
  async keys() {
    throw new Error(`${this.keys.name} not implemented`);
  }

  /**
   * Closes the storage and cleans up resources.
   * @returns {Promise<void>}
   * @throws {Error} If the operation fails or is not implemented
   */
  async close() {
    throw new Error(`${this.close.name} not implemented`);
  }
}
