import { ChatHandler } from '../handlers/chat.handler';
import type { RealtimeGateway } from '../gateway/gateway';
import type { AuthenticatedSocketContext } from '../gateway/gateway.interface';
import type { EventEnvelope } from '../types/envelope';
import { RealtimeErrorCode } from '../types/errors';

// Mock container to isolate tests
jest.mock('../../config/container', () => {
  const mockResolve = jest.fn();
  return {
    __esModule: true,
    default: {
      resolve: mockResolve,
    },
    mockResolve,
  };
});

describe('ChatHandler', () => {
  let chatHandler: ChatHandler;
  let mockGateway: jest.Mocked<RealtimeGateway>;
  let mockMessageService: any;
  let mockResolve: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();

    mockGateway = {
      registerHandler: jest.fn(),
      broadcastToRoom: jest.fn(),
    } as any;

    mockMessageService = {
      sendMessage: jest.fn(),
      updateReadCursor: jest.fn(),
    };

    mockResolve = require('../../config/container').mockResolve;
    mockResolve.mockImplementation((name: string) => {
      if (name === 'messageService') return mockMessageService;
      throw new Error(`Unknown dependency ${name}`);
    });

    chatHandler = new ChatHandler(mockGateway);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('handleSendMessage', () => {
    const context = { userId: '1', displayName: 'Alice' } as AuthenticatedSocketContext;
    const envelope = {
      requestId: 'req-1',
      data: { channelId: '100', content: 'Hello' },
    } as EventEnvelope;

    it('should successfully send a message and return ACK + broadcast', async () => {
      const savedMsg = { id: '1000', content: 'Hello' };
      mockMessageService.sendMessage.mockResolvedValueOnce(savedMsg);

      const result = await chatHandler.handleSendMessage(envelope, context);

      expect(result.success).toBe(true);
      expect(result.ack.event).toBe('ack');
      expect(result.broadcast.event).toBe('message.created');
      expect(result.broadcast.rooms).toEqual(['channel:100']);
      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(
        BigInt(100),
        BigInt(1),
        { content: 'Hello', replyToId: undefined, attachments: undefined }
      );
    });

    it('should return NACK if channelId is missing', async () => {
      const badEnvelope = { requestId: 'req-2', data: { content: 'No channel' } } as EventEnvelope;

      const result = await chatHandler.handleSendMessage(badEnvelope, context);

      expect(result.success).toBe(false);
      expect(result.nack.error.code).toBe(RealtimeErrorCode.PAYLOAD_INVALID);
    });
  });

  describe('handleTypingStarted & handleTypingStopped', () => {
    const context = { userId: '1' } as AuthenticatedSocketContext;
    const envelope = { requestId: 'req-1', data: { channelId: '100' } } as EventEnvelope;

    it('should broadcast typing started successfully', async () => {
      const result = await chatHandler.handleTypingStarted(envelope, context);

      expect(result.success).toBe(true);
      expect(result.broadcast.event).toBe('typing.started');
      expect(result.broadcast.data).toEqual({ channelId: '100', userId: '1' });
    });

    it('should broadcast typing stopped successfully', async () => {
      const result = await chatHandler.handleTypingStopped(envelope, context);

      expect(result.success).toBe(true);
      expect(result.broadcast.event).toBe('typing.stopped');
    });
  });

  describe('handleReadCursorUpdate (Debounced)', () => {
    const context = { userId: '1' } as AuthenticatedSocketContext;
    const envelope = {
      requestId: 'req-1',
      data: { channelId: '100', lastReadMessageId: '1001' },
    } as EventEnvelope;

    it('should respond with immediate success ACK and defer DB write', async () => {
      const result = await chatHandler.handleReadCursorUpdate(envelope, context);

      // Verify immediate response
      expect(result.success).toBe(true);
      expect(result.ack.event).toBe('ack');
      
      // Database should not be called yet due to debouncing
      expect(mockMessageService.updateReadCursor).not.toHaveBeenCalled();

      // Fast-forward time by 2 seconds
      mockMessageService.updateReadCursor.mockResolvedValueOnce({ success: true });
      jest.advanceTimersByTime(2000);
      
      // Flush async microtasks so that the await updateReadCursor resolves
      await new Promise(jest.requireActual('timers').setImmediate);

      // Database write should execute now
      expect(mockMessageService.updateReadCursor).toHaveBeenCalledWith(
        BigInt(100),
        BigInt(1),
        BigInt(1001)
      );

      // Fast-forward should trigger gateway broadcast
      expect(mockGateway.broadcastToRoom).toHaveBeenCalledWith(
        'channel:100',
        expect.objectContaining({ event: 'read.cursor.updated' })
      );
    });

    it('should reset timer and throttle database writes if triggered rapidly', async () => {
      await chatHandler.handleReadCursorUpdate(envelope, context);
      
      // Advance by 1 second (no database call yet)
      jest.advanceTimersByTime(1000);
      expect(mockMessageService.updateReadCursor).not.toHaveBeenCalled();

      // Trigger update again before 2 seconds are up
      const secondEnvelope = {
        requestId: 'req-2',
        data: { channelId: '100', lastReadMessageId: '1002' },
      } as EventEnvelope;
      await chatHandler.handleReadCursorUpdate(secondEnvelope, context);

      // Advance by another 1.5 seconds (2.5 seconds total since first trigger, but only 1.5 since second trigger)
      jest.advanceTimersByTime(1500);
      expect(mockMessageService.updateReadCursor).not.toHaveBeenCalled();

      // Advance past remaining 500ms
      mockMessageService.updateReadCursor.mockResolvedValueOnce({ success: true });
      jest.advanceTimersByTime(500);
      await new Promise(jest.requireActual('timers').setImmediate);

      // DB should be called exactly ONCE with the LATEST cursor message ID
      expect(mockMessageService.updateReadCursor).toHaveBeenCalledTimes(1);
      expect(mockMessageService.updateReadCursor).toHaveBeenCalledWith(
        BigInt(100),
        BigInt(1),
        BigInt(1002)
      );
    });
  });
});
