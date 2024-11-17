import { jest } from '@jest/globals';

// Mock dependencies
const mockOn = jest.fn();
const mockClose = jest.fn();

const mockWebSocketServer = {
  on: mockOn,
  close: mockClose,
};

// Mock the WebSocket module
await jest.unstable_mockModule('ws', () => ({
  WebSocketServer: jest.fn(() => mockWebSocketServer),
}));

const { P2PServer } = await import('../server/wss.js');
const { PeerRepository } = await import('../server/peers/peerRepository.js');
const { MessageService } = await import('../server/messages/messageService.js');

describe('WebSocketServer', () => {
  let server;
  let peerRepository;
  let messageService;
  let mockConnectionHandler;
  let consoleSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Spy on console.error but prevent actual logging
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create fresh instances
    peerRepository = new PeerRepository();
    messageService = new MessageService();
    server = new P2PServer(3000, peerRepository, messageService);

    // Capture the connection handler
    mockOn.mockImplementation((event, handler) => {
      if (event === 'connection') mockConnectionHandler = handler;
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('server initialization', () => {
    it('should create WebSocketServer with correct port', () => {
      server.initialize();
      expect(mockWebSocketServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should store server instance', () => {
      const wss = server.initialize();
      expect(wss).toBe(mockWebSocketServer);
    });
  });

  describe('connection handling', () => {
    it('should create new peer connection for each client', () => {
      server.initialize();

      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
      };

      // Simulate a client connection
      mockConnectionHandler(mockWs);

      // Verify peer was created
      expect(peerRepository.getAll()).toHaveLength(1);

      // Verify initial peers list was sent
      expect(mockWs.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('all-peers');
    });

    it('should handle multiple client connections', () => {
      server.initialize();

      // Simulate multiple client connections
      const clients = Array.from({ length: 3 }, () => ({
        on: jest.fn(),
        send: jest.fn(),
      }));

      clients.forEach((client) => mockConnectionHandler(client));

      // Verify peers were created
      expect(peerRepository.getAll()).toHaveLength(3);

      // Verify each client received peers list
      clients.forEach((client) => {
        expect(client.send).toHaveBeenCalled();
        const sentMessage = JSON.parse(client.send.mock.calls[0][0]);
        expect(sentMessage.type).toBe('all-peers');
      });
    });

    it('should handle client disconnection', () => {
      server.initialize();

      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
      };

      // Capture the close handler when client connects
      mockWs.on.mockImplementation((event, handler) => {
        if (event === 'close') {
          // Immediately call the close handler to simulate disconnect
          handler();
        }
      });

      // Connect and immediately disconnect client
      mockConnectionHandler(mockWs);

      // Verify peer was removed
      expect(peerRepository.getAll()).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle connection errors gracefully', () => {
      server.initialize();

      const mockWs = {
        on: jest.fn(),
        send: jest.fn().mockImplementation(() => {
          throw new Error('Send failed');
        }),
      };

      // Should not throw when connection fails
      expect(() => mockConnectionHandler(mockWs)).not.toThrow();

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
    });

    it('should handle message parsing errors', () => {
      server.initialize();

      const mockWs = {
        on: jest.fn(),
        send: jest.fn(),
      };

      // Capture the message handler
      mockWs.on.mockImplementation((event, handler) => {
        if (event === 'message') {
          // Send invalid JSON to test error handling
          handler(Buffer.from('{ invalid json'));
        }
      });

      // Should not throw when parsing fails
      expect(() => mockConnectionHandler(mockWs)).not.toThrow();
    });
  });
});
