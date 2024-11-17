import { hash } from '../utils/hash.js';
import { RoutingTable } from './routingTable.js';

export class DHTNode {
  constructor() {
    this.nodeId = hash(Math.random().toString());
    this.routingTable = new RoutingTable(); // TODO: This needs to be finger table?
  }
}
