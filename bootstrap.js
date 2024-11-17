import { P2PServer } from "./server/wss.js";
import { PeerRepository } from "./server/peers/peerRepository.js";
import { MessageService } from "./server/messages/messageService.js";

export const createWss = (port) => {
  const peerRepository = new PeerRepository();
  const messageService = new MessageService();

  console.log(`Server running on ${port}...`);
  return new P2PServer(port, peerRepository, messageService).initialize();
};

createWss(3000);
