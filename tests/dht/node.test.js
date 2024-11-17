// import { jest } from '@jest/globals';

import { DHTNode } from '../../dht/core/node';

describe('DHTNode', () => {
  it('should create a node with a random ID', async () => {
    const node = new DHTNode();

    expect(node.nodeId).toBeDefined();
    expect(typeof node.nodeId).toBe('number');
  });

  it('should generate a deterministic nodeId length', () => {
    const node = new DHTNode();
    const maxNodeId = BigInt('0x' + 'f'.repeat(40)); // Max 160-bit integer

    expect(node.nodeId).toBeGreaterThan(0);
    expect(BigInt(node.nodeId)).toBeLessThanOrEqual(maxNodeId); // Ensure it's within 160-bit range
  });

  it('should place node IDs in a circular orientation', () => {
    const numNodes = 5;
    const maxNodeId = BigInt('0x' + 'f'.repeat(40)); // Max 160-bit value
    const nodes = Array.from({ length: numNodes }, () => new DHTNode());

    // Extract nodeIds and sort them
    const sortedNodeIds = nodes.map((node) => BigInt(node.nodeId)).sort((a, b) => (a < b ? -1 : 1));

    // Assert circularity
    for (let i = 0; i < numNodes; i++) {
      const currentNode = sortedNodeIds[i];
      const nextNode = sortedNodeIds[(i + 1) % numNodes]; // Circular next
      const distance = (nextNode - currentNode + maxNodeId + 1n) % (maxNodeId + 1n);

      expect(distance).toBeGreaterThan(0n); // Ensure no overlaps
    }
  });
});
