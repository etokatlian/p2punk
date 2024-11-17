/**
 * @fileoverview Manages individual peer connections and their lifecycle in the P2P network.
 * @module peer/peerConnection
 */

/**
 * Manages a single peer's connection, message handling, and lifecycle.
 */
export class PeerConnection {
  /**
   * Creates a new peer connection instance.
   * @param {import('ws').WebSocket} ws - The WebSocket connection instance for this peer
   * @param {import('./peerRepository.js').PeerRepository} peerRepository - Repository for managing peer data
   * @param {import('../messages/messageService.js').MessageService} messageService - Service for handling message broadcasting
   */
  constructor(ws, peerRepository, messageService) {
    /** @private */
    this.ws = ws;
    /** @private */
    this.peerRepository = peerRepository;
    /** @private */
    this.messageService = messageService;

    // Create a new peer when connection is established
    this.peer = this.peerRepository.createPeer();
    this.initialize();
  }

  /**
   * Initializes the peer connection by adding it to the repository,
   * sending initial peer list, and setting up event listeners.
   * @private
   */
  initialize() {
    this.peerRepository.add(this.peer.id, {
      ws: this.ws,
      ...this.peer,
    });
    this.sendInitialPeers();
    this.setupEventListeners();
  }

  /**
   * Sends the current list of peers (in serializable format) to the newly connected peer.
   * @private
   */
  sendInitialPeers() {
    const allPeers = this.peerRepository.getAllSerializable();
    this.messageService.send(this.ws, {
      type: 'all-peers',
      peers: allPeers,
    });
  }

  /**
   * Handles incoming messages from the peer by broadcasting them to all connected peers.
   * @param {string|Object} message - The message received from the peer
   * @private
   */
  handleMessage(message) {
    const allPeers = this.peerRepository.getAll();
    this.messageService.broadcast(allPeers, {
      type: 'message',
      peer: this.peer.id,
      content: message,
    });
  }

  /**
   * Handles the peer disconnection by removing them from the repository.
   * @private
   */
  handleClose() {
    this.peerRepository.remove(this.peer.id);
  }

  /**
   * Sets up WebSocket event listeners for the peer connection.
   * @private
   */
  setupEventListeners() {
    this.ws.on('message', (data) => {
      try {
        // Try to parse as JSON first
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        // If JSON parsing fails, treat it as plain text
        this.handleMessage(data.toString());
      }
    });

    this.ws.on('close', () => {
      this.handleClose();
    });
  }

  /**
   * Gets the current peer's data.
   * @returns {import('./peers.js').Peer} The peer object
   */
  getPeer() {
    return this.peer;
  }
}
