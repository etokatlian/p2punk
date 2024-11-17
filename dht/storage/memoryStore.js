import { Storage } from './storage.js';

export class MemoryStore extends Storage {
  constructor() {
    super();
    this.store = {};
  }

  get(key) {
    return this.store[key];
  }

  set(key, value) {
    this.store[key] = value;
  }
}
