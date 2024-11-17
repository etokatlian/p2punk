import { jest } from '@jest/globals';
import { PeerRepository } from '../server/peers/peerRepository.js';

describe('PeerRepository', () => {
  let peerRepository;
  let mockWebSocket;

  beforeEach(() => {
    peerRepository = new PeerRepository();
    mockWebSocket = {
      send: jest.fn(),
      on: jest.fn(),
    };
  });

  describe('createPeer', () => {
    it('should create peer with required properties', () => {
      const peer = peerRepository.createPeer();

      expect(peer).toHaveProperty('id');
      expect(peer).toHaveProperty('connectionCreated');
      expect(peer).toHaveProperty('lastActive');
      expect(peer.id).toHaveLength(32); // 16 bytes in hex = 32 characters
    });

    it('should create unique peers', () => {
      const peers = Array.from({ length: 10 }, () => peerRepository.createPeer());
      const uniqueIds = new Set(peers.map((p) => p.id));
      expect(uniqueIds.size).toBe(10);
    });

    it('should set timestamps as numbers', () => {
      const peer = peerRepository.createPeer();
      expect(typeof peer.connectionCreated).toBe('number');
      expect(typeof peer.lastActive).toBe('number');
    });

    it('should set recent timestamps', () => {
      const now = Date.now();
      const peer = peerRepository.createPeer();

      expect(peer.connectionCreated).toBeLessThanOrEqual(now + 1000);
      expect(peer.connectionCreated).toBeGreaterThan(now - 1000);
      expect(peer.lastActive).toBeLessThanOrEqual(now + 1000);
      expect(peer.lastActive).toBeGreaterThan(now - 1000);
    });
  });

  describe('add', () => {
    it('should add peer to repository', () => {
      const peer = peerRepository.createPeer();
      peerRepository.add(peer.id, { ...peer, ws: mockWebSocket });

      const storedPeers = peerRepository.getAll();
      expect(storedPeers).toHaveLength(1);
      expect(storedPeers[0].id).toBe(peer.id);
    });

    it('should update existing peer', () => {
      const peer = peerRepository.createPeer();
      const initialWs = { send: jest.fn() };
      const updatedWs = { send: jest.fn() };

      // Add initial peer
      peerRepository.add(peer.id, { ...peer, ws: initialWs });

      // Update peer with new websocket
      peerRepository.add(peer.id, { ...peer, ws: updatedWs });

      const storedPeers = peerRepository.getAll();
      expect(storedPeers).toHaveLength(1);
      expect(storedPeers[0].ws).toBe(updatedWs);
    });

    it('should handle multiple peers', () => {
      const peers = Array.from({ length: 5 }, () => {
        const peer = peerRepository.createPeer();
        return { ...peer, ws: mockWebSocket };
      });

      peers.forEach((peer) => peerRepository.add(peer.id, peer));
      expect(peerRepository.getAll()).toHaveLength(5);
    });
  });

  describe('remove', () => {
    it('should remove peer from repository', () => {
      const peer = peerRepository.createPeer();
      peerRepository.add(peer.id, { ...peer, ws: mockWebSocket });

      expect(peerRepository.getAll()).toHaveLength(1);

      peerRepository.remove(peer.id);
      expect(peerRepository.getAll()).toHaveLength(0);
    });

    it('should handle removing non-existent peer', () => {
      expect(() => peerRepository.remove('non-existent-id')).not.toThrow();
    });

    it('should only remove specified peer', () => {
      const peer1 = peerRepository.createPeer();
      const peer2 = peerRepository.createPeer();

      peerRepository.add(peer1.id, { ...peer1, ws: mockWebSocket });
      peerRepository.add(peer2.id, { ...peer2, ws: mockWebSocket });

      peerRepository.remove(peer1.id);

      const remainingPeers = peerRepository.getAll();
      expect(remainingPeers).toHaveLength(1);
      expect(remainingPeers[0].id).toBe(peer2.id);
    });
  });

  describe('getAllSerializable', () => {
    it('should return peers without websocket', () => {
      const peer = peerRepository.createPeer();
      peerRepository.add(peer.id, { ...peer, ws: mockWebSocket });

      const serializedPeers = peerRepository.getAllSerializable();
      expect(serializedPeers).toHaveLength(1);
      expect(serializedPeers[0]).not.toHaveProperty('ws');
      expect(serializedPeers[0].id).toBe(peer.id);
    });

    it('should handle empty repository', () => {
      const serializedPeers = peerRepository.getAllSerializable();
      expect(serializedPeers).toEqual([]);
    });

    it('should maintain peer data except websocket', () => {
      const peer = peerRepository.createPeer();
      const extraData = {
        name: 'test peer',
        data: { foo: 'bar' },
      };

      peerRepository.add(peer.id, { ...peer, ...extraData, ws: mockWebSocket });

      const serializedPeers = peerRepository.getAllSerializable();
      expect(serializedPeers[0]).toEqual(expect.objectContaining(extraData));
    });
  });

  describe('getAll', () => {
    it('should return all peers with websocket', () => {
      const peer = peerRepository.createPeer();
      peerRepository.add(peer.id, { ...peer, ws: mockWebSocket });

      const allPeers = peerRepository.getAll();
      expect(allPeers).toHaveLength(1);
      expect(allPeers[0].ws).toBe(mockWebSocket);
      expect(allPeers[0].id).toBe(peer.id);
    });

    it('should handle empty repository', () => {
      const allPeers = peerRepository.getAll();
      expect(allPeers).toEqual([]);
    });

    it('should return deep copy of peers', () => {
      const peer = peerRepository.createPeer();
      peerRepository.add(peer.id, { ...peer, ws: mockWebSocket });

      const allPeers = peerRepository.getAll();
      allPeers[0].newProperty = 'test';

      // Original peer should not be modified
      expect(peerRepository.getAll()[0]).not.toHaveProperty('newProperty');
    });
  });
});
