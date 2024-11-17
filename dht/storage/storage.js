export class Storage {
  constructor() {
    if (new.target === Storage) {
      throw new TypeError('Cannot instantiate Storage directly');
    }
  }

  get(key) {
    console.log(`key > ${key}`);
    throw new Error(`${this.get.name} not implemented`);
  }

  set(key, value) {
    console.log(`key > ${key}, value > ${value}`);
    throw new Error(`${this.set.name} not implemented`);
  }
}
