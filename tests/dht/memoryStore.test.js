import { MemoryStore } from '../../dht/storage/memoryStore';
import { Storage } from '../../dht/storage/storage';

describe('MemoryStore', () => {
  it ('should implement the Storage interface', () => {
    const memoryStore = new MemoryStore();
    expect(memoryStore).toBeInstanceOf(Storage)
    expect(memoryStore.get).toBeDefined();
    expect(memoryStore.set).toBeDefined();
  });
});
