/**
 * @fileoverview Service for handling message sending and broadcasting in the P2P network.
 * @module message/messageService
 */

/**
 * Service class for managing message communication between peers.
 * Handles both direct messaging and broadcasting to multiple peers.
 */
export class MessageService {
  /**
   * Sends a message to a specific peer through their WebSocket connection.
   * The message is automatically stringified before sending.
   *
   * @param {import('ws').WebSocket} ws - The WebSocket connection to send the message through
   * @param {Object} message - The message object to send
   * @param {string} message.type - The type of message being sent (e.g., "all-peers", "message")
   * @param {*} [message.peers] - Array of peer data (for "all-peers" type)
   * @param {string} [message.peer] - ID of the sending peer (for "message" type)
   * @param {string|Object} [message.content] - The message content (for "message" type)
   * @returns {void}
   * @throws {Error} If the WebSocket connection is not in OPEN state
   */
  send(ws, message) {
    ws.send(JSON.stringify(message));
  }

  /**
   * Broadcasts a message to multiple peers simultaneously.
   * The message is stringified once and sent to all provided peers.
   *
   * @param {Array<import('../peer/peers.js').Peer>} peers - Array of peers to broadcast the message to
   * @param {Object} message - The message object to broadcast
   * @param {string} message.type - The type of message being broadcast (e.g., "message")
   * @param {string} message.peer - ID of the sending peer
   * @param {string|Object} message.content - The message content
   * @returns {void}
   * @throws {Error} If any peer's WebSocket connection is not in OPEN state
   */
  broadcast(peers, message) {
    // Stringify once for efficiency
    const messageString = JSON.stringify(message);
    peers.forEach((peer) => {
      try {
        peer.ws.send(messageString);
      } catch (error) {
        console.error(`Failed to send message to peer ${peer.id}:`, error);
      }
    });
  }
}
