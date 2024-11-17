import { jest } from "@jest/globals";

// Create mock with jest.fn()
const mockOn = jest.fn();
const mockClose = jest.fn();

// Create a mock WebSocketServer instance
const mockWssInstance = {
  on: mockOn,
  close: mockClose,
};

// Create a mock WebSocketServer constructor
const MockWebSocketServer = jest.fn(() => mockWssInstance);

// Mock the WebSocket module before any imports that use it
await jest.unstable_mockModule("ws", () => ({
  WebSocketServer: MockWebSocketServer,
}));

// Import modules after setting up the mock
const { P2PServer } = await import("../server/webSocketServer.js");
const { PeerRepository } = await import("../peer/peerRepository.js");
const { MessageService } = await import("../message/messageService.js");

describe("Bootstrap Server", () => {
  let server;
  let peerRepository;
  let messageService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    peerRepository = new PeerRepository();
    messageService = new MessageService();
    server = new P2PServer(3000, peerRepository, messageService);
  });

  it("should initialize WebSocket server", () => {
    server.initialize();

    // Verify WebSocketServer was constructed with correct port
    expect(MockWebSocketServer).toHaveBeenCalledWith({ port: 3000 });

    // Verify event listener was set up
    expect(mockOn).toHaveBeenCalledWith("connection", expect.any(Function));
  });
});
