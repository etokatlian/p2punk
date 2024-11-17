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
   * @returns {string} The value associated with the key
   */
  get(key) {
    console.log(`key > ${key}`);
    throw new Error(`${this.get.name} not implemented`);
  }

  /**
   * Sets a value in storage for the given key.
   * @param {string} key - The key to set in storage
   * @param {string} value - The value to associate with the key
   * @returns {void}
   */
  set(key, value) {
    console.log(`key > ${key}, value > ${value}`);
    throw new Error(`${this.set.name} not implemented`);
  }
}
