import { jest } from "@jest/globals";

const mockWebSocket = {
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
};

// Mock the WebSocket module
await jest.unstable_mockModule("ws", () => ({
  WebSocket: jest.fn(() => mockWebSocket),
}));

const { PeerRepository } = await import("../peer/peerRepository.js");
const { PeerConnection } = await import("../peer/peerConnection.js");
const { MessageService } = await import("../message/messageService.js");

describe("Peer Management", () => {
  let peerRepository;
  let peerConnection;
  let messageService;

  beforeEach(() => {
    jest.clearAllMocks();
    peerRepository = new PeerRepository();
    messageService = new MessageService();
    peerConnection = new PeerConnection(
      mockWebSocket,
      peerRepository,
      messageService
    );
  });

  describe("createPeer", () => {
    it("should create a peer with required properties", () => {
      const peer = peerConnection.getPeer();

      expect(peer).toHaveProperty("id");
      expect(peer).toHaveProperty("connectionCreated");
      expect(peer).toHaveProperty("lastActive");

      expect(typeof peer.id).toBe("string");
      expect(peer.id).toHaveLength(32);
      expect(typeof peer.connectionCreated).toBe("number");
      expect(typeof peer.lastActive).toBe("number");
    });

    it("should create unique IDs for different peers", () => {
      const peer1 = peerConnection.getPeer();
      const peerConnection2 = new PeerConnection(
        mockWebSocket,
        peerRepository,
        messageService
      );
      const peer2 = peerConnection2.getPeer();

      expect(peer1.id).not.toBe(peer2.id);
    });
  });

  describe("getAllPeersSerializable", () => {
    it("should return peers without ws property", () => {
      const peer = peerConnection.getPeer();
      const serializedPeers = peerRepository.getAllSerializable();

      expect(serializedPeers).toHaveLength(1);
      expect(serializedPeers[0]).not.toHaveProperty("ws");
      expect(serializedPeers[0]).toHaveProperty("id", peer.id);
    });
  });

  describe("getAllPeers", () => {
    it("should return all peers including ws property", () => {
      const peer = peerConnection.getPeer();
      const allPeers = peerRepository.getAll();

      expect(allPeers).toHaveLength(1);
      expect(allPeers[0]).toHaveProperty("ws", mockWebSocket);
      expect(allPeers[0]).toHaveProperty("id", peer.id);
    });
  });
});
