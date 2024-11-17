import { jest } from '@jest/globals';
import { MessageService } from '../../server/messages/messageService.js';

describe('MessageService', () => {
  let messageService;
  let mockWs;
  let consoleSpy;

  beforeEach(() => {
    // Spy on console.error but prevent actual logging
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockWs = {
      send: jest.fn(),
    };
    messageService = new MessageService();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('send', () => {
    it('should stringify and send message to websocket', () => {
      const message = {
        type: 'message',
        peer: '123',
        content: 'test message',
      };

      messageService.send(mockWs, message);
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should handle complex objects in message content', () => {
      const message = {
        type: 'message',
        peer: '123',
        content: { foo: 'bar', baz: [1, 2, 3] },
      };

      messageService.send(mockWs, message);
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should handle send failures gracefully', () => {
      const message = { type: 'message', content: 'test' };
      mockWs.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      // Should not throw
      expect(() => messageService.send(mockWs, message)).not.toThrow();

      // Should log error
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send message:', expect.any(Error));
    });
  });

  describe('broadcast', () => {
    it('should send message to all peers', () => {
      const peers = [
        { id: '1', ws: { send: jest.fn() } },
        { id: '2', ws: { send: jest.fn() } },
        { id: '3', ws: { send: jest.fn() } },
      ];

      const message = {
        type: 'message',
        peer: '123',
        content: 'broadcast test',
      };

      messageService.broadcast(peers, message);
      const messageString = JSON.stringify(message);

      peers.forEach((peer) => {
        expect(peer.ws.send).toHaveBeenCalledWith(messageString);
      });
    });

    it('should continue broadcasting if one peer fails', () => {
      const failingPeer = {
        id: 'fail',
        ws: {
          send: jest.fn().mockImplementation(() => {
            throw new Error('Send failed');
          }),
        },
      };

      const successPeer = {
        id: 'success',
        ws: { send: jest.fn() },
      };

      const peers = [failingPeer, successPeer];
      const message = {
        type: 'message',
        peer: '123',
        content: 'test',
      };

      // Should not throw
      messageService.broadcast(peers, message);

      // Should log error for failing peer
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send message to peer fail:',
        expect.any(Error)
      );

      // Should still send to successful peer
      expect(successPeer.ws.send).toHaveBeenCalled();
    });

    it('should stringify message only once for efficiency', () => {
      const peers = Array.from({ length: 3 }, (_, i) => ({
        id: String(i),
        ws: { send: jest.fn() },
      }));

      const message = {
        type: 'message',
        peer: '123',
        content: 'test',
      };

      const stringifySpy = jest.spyOn(JSON, 'stringify');
      messageService.broadcast(peers, message);

      // Should stringify only once
      expect(stringifySpy).toHaveBeenCalledTimes(1);

      // But send to all peers
      expect(peers[0].ws.send).toHaveBeenCalled();
      expect(peers[1].ws.send).toHaveBeenCalled();
      expect(peers[2].ws.send).toHaveBeenCalled();

      stringifySpy.mockRestore();
    });
  });
});
