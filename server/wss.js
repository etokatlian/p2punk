import { WebSocketServer } from 'ws';
import { PeerConnection } from './peers/peerConnection.js';

/**
 * P2P WebSocket server that manages peer connections and message handling.
 */
export class P2PServer {
  /**
   * Creates a new P2P WebSocket server instance.
   * @param {number} port - The port number to listen on.
   * @param {import('./peers/peerRepository.js').PeerRepository} peerRepository - Repository for managing peer data.
   * @param {import('./messages/messageService.js').MessageService} messageService - Service for handling peer messages.
   */
  constructor(port, peerRepository, messageService) {
    /** @private */
    this.port = port;
    /** @private */
    this.peerRepository = peerRepository;
    /** @private */
    this.messageService = messageService;
    /** @private */
    this.wss = null;
  }

  /**
   * Initializes the WebSocket server and sets up connection handling.
   * @returns {WebSocketServer} The initialized WebSocket server instance.
   */
  initialize() {
    this.wss = new WebSocketServer({ port: this.port });
    this.setupConnectionHandler();
    return this.wss;
  }

  /**
   * Sets up the connection handler for incoming WebSocket connections.
   * Creates a new peer and establishes a peer connection for each incoming connection.
   * @private
   */
  setupConnectionHandler() {
    if (!this.wss) {
      throw new Error('WebSocketServer is not initialized');
    }

    this.wss.on('connection', (ws) => {
      new PeerConnection(ws, this.peerRepository, this.messageService);
    });
  }
}
