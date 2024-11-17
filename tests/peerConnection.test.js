import { jest } from '@jest/globals';

const mockWebSocket = {
  on: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
};

// Mock the WebSocket module
await jest.unstable_mockModule('ws', () => ({
  WebSocket: jest.fn(() => mockWebSocket),
}));

const { PeerConnection } = await import('../server/peers/peerConnection.js');
const { PeerRepository } = await import('../server/peers/peerRepository.js');
const { MessageService } = await import('../server/messages/messageService.js');

describe('PeerConnection', () => {
  let peerConnection;
  let peerRepository;
  let messageService;
  let mockMessageHandler;
  let mockCloseHandler;
  let consoleSpy;

  beforeEach(() => {
    // Spy on console.error but prevent actual logging
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Reset all mocks
    jest.clearAllMocks();

    // Create fresh instances
    peerRepository = new PeerRepository();
    messageService = new MessageService();

    // Capture the message and close handlers
    mockWebSocket.on.mockImplementation((event, handler) => {
      if (event === 'message') mockMessageHandler = handler;
      if (event === 'close') mockCloseHandler = handler;
    });

    peerConnection = new PeerConnection(mockWebSocket, peerRepository, messageService);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('initialization', () => {
    it('should create a new peer and add it to repository', () => {
      const peer = peerConnection.getPeer();
      const allPeers = peerRepository.getAll();

      expect(peer).toBeDefined();
      expect(peer.id).toBeDefined();
      expect(allPeers).toHaveLength(1);
      expect(allPeers[0].id).toBe(peer.id);
    });

    it('should set up WebSocket event listeners', () => {
      expect(mockWebSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWebSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should send initial peers list to new connection', () => {
      expect(mockWebSocket.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('all-peers');
      expect(Array.isArray(sentMessage.peers)).toBe(true);
    });

    it('should handle send failures during initialization gracefully', () => {
      mockWebSocket.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      // Should not throw when creating new connection
      expect(() => new PeerConnection(mockWebSocket, peerRepository, messageService)).not.toThrow();

      // Should log error
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
    });
  });

  describe('message handling', () => {
    it('should handle JSON messages', () => {
      const jsonMessage = { data: 'test message' };
      const messageBuffer = Buffer.from(JSON.stringify(jsonMessage));

      // Simulate receiving a message
      mockMessageHandler(messageBuffer);

      // Verify broadcast was called with correct format
      expect(mockWebSocket.send).toHaveBeenCalled();
      const broadcastMessage = JSON.parse(mockWebSocket.send.mock.calls[1][0]);
      expect(broadcastMessage.type).toBe('message');
      expect(broadcastMessage.peer).toBe(peerConnection.getPeer().id);
      expect(broadcastMessage.content).toEqual(jsonMessage);
    });

    it('should handle plain text messages', () => {
      const textMessage = 'Hello, world!';
      const messageBuffer = Buffer.from(textMessage);

      // Simulate receiving a message
      mockMessageHandler(messageBuffer);

      // Verify broadcast was called with correct format
      expect(mockWebSocket.send).toHaveBeenCalled();
      const broadcastMessage = JSON.parse(mockWebSocket.send.mock.calls[1][0]);
      expect(broadcastMessage.type).toBe('message');
      expect(broadcastMessage.peer).toBe(peerConnection.getPeer().id);
      expect(broadcastMessage.content).toBe(textMessage);
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{ bad json';
      const messageBuffer = Buffer.from(malformedJson);

      // Should not throw
      mockMessageHandler(messageBuffer);

      // Should treat it as plain text
      const broadcastMessage = JSON.parse(mockWebSocket.send.mock.calls[1][0]);
      expect(broadcastMessage.content).toBe(malformedJson);
    });

    it('should handle broadcast failures gracefully', () => {
      mockWebSocket.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      const message = 'test message';
      const messageBuffer = Buffer.from(message);

      // Should not throw
      expect(() => mockMessageHandler(messageBuffer)).not.toThrow();

      // Should log error
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
    });
  });

  describe('connection lifecycle', () => {
    it('should remove peer from repository on connection close', () => {
      // Verify peer exists
      expect(peerRepository.getAll()).toHaveLength(1);

      // Simulate connection close
      mockCloseHandler();

      // Verify peer was removed
      expect(peerRepository.getAll()).toHaveLength(0);
    });

    it('should handle multiple peer connections', () => {
      // Create second connection
      const peerConnection2 = new PeerConnection(mockWebSocket, peerRepository, messageService);

      expect(peerRepository.getAll()).toHaveLength(2);

      // Verify peers have different IDs
      const peer1 = peerConnection.getPeer();
      const peer2 = peerConnection2.getPeer();
      expect(peer1.id).not.toBe(peer2.id);
    });
  });
});
