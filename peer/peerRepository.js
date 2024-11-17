/**
 * @fileoverview Repository for managing peer data and operations.
 * Provides a centralized way to create, store, and retrieve peer information.
 * @module peer/peerRepository
 */

import crypto from "node:crypto";

/**
 * Represents a peer in the P2P network.
 * @typedef {Object} Peer
 * @property {string} id - Unique identifier for the peer, generated as a hex string
 * @property {number} connectionCreated - Unix timestamp of when the peer connection was established
 * @property {number} lastActive - Unix timestamp of the peer's most recent activity
 * @property {import('ws').WebSocket} [ws] - WebSocket connection instance for the peer (optional)
 */

/**
 * Repository class for managing peer data and operations.
 * Handles peer creation, storage, retrieval, and removal.
 */
export class PeerRepository {
  /**
   * Creates a new PeerRepository instance.
   */
  constructor() {
    /**
     * Storage for all active peers, indexed by their unique IDs.
     * @private
     * @type {Object.<string, Peer>}
     */
    this.peers = {};
  }

  /**
   * Creates a new peer with a randomly generated ID and current timestamps.
   * Uses crypto.randomBytes for secure ID generation.
   *
   * @returns {Omit<Peer, 'ws'>} A new peer object without a WebSocket connection
   * @example
   * const newPeer = peerRepository.createPeer();
   * // => { id: "1a2b3c...", connectionCreated: 1234567890, lastActive: 1234567890 }
   */
  createPeer() {
    return {
      id: crypto.randomBytes(16).toString("hex"),
      connectionCreated: Date.now(),
      lastActive: Date.now(),
    };
  }

  /**
   * Adds a peer to the repository.
   * If a peer with the same ID already exists, it will be overwritten.
   *
   * @param {string} id - Unique identifier for the peer
   * @param {Peer} peer - Complete peer object to add to the repository
   * @returns {void}
   * @example
   * peerRepository.add(peer.id, { ...peer, ws: websocketConnection });
   */
  add(id, peer) {
    this.peers[id] = peer;
  }

  /**
   * Removes a peer from the repository by its ID.
   * If the peer doesn't exist, this operation has no effect.
   *
   * @param {string} id - Unique identifier of the peer to remove
   * @returns {void}
   * @example
   * peerRepository.remove("1a2b3c...");
   */
  remove(id) {
    delete this.peers[id];
  }

  /**
   * Retrieves all peers with their complete data, including WebSocket instances.
   * This is typically used for internal operations where the WebSocket connections are needed.
   *
   * @returns {Array<Peer>} Array of complete peer objects including WebSocket connections
   * @example
   * const allPeers = peerRepository.getAll();
   * // => [{ id: "1a2b3c...", connectionCreated: 1234567890, lastActive: 1234567890, ws: WebSocket }, ...]
   */
  getAll() {
    return Object.values(this.peers);
  }

  /**
   * Retrieves all peers in a format safe for serialization by removing WebSocket instances.
   * This is useful when needing to send peer data over the network or store it.
   *
   * @returns {Array<Omit<Peer, 'ws'>>} Array of peers without their WebSocket connections
   * @example
   * const serializablePeers = peerRepository.getAllSerializable();
   * // => [{ id: "1a2b3c...", connectionCreated: 1234567890, lastActive: 1234567890 }, ...]
   */
  getAllSerializable() {
    return this.getAll().map(({ ws, ...rest }) => rest);
  }
}
