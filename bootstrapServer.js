import { P2PServer } from "./server/webSocketServer.js";
import { PeerRepository } from "./peer/peerRepository.js";
import { MessageService } from "./message/messageService.js";

export const createWss = (port) => {
  const peerRepository = new PeerRepository();
  const messageService = new MessageService();

  return new P2PServer(port, peerRepository, messageService).initialize();
};

createWss(3000);
