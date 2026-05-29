import logger from '../../shared/utils/logger';
import type { RealtimeGateway } from '../gateway/gateway';
import type { AuthenticatedSocketContext } from '../gateway/gateway.interface';
import type { EventEnvelope } from '../types/envelope';
import { RealtimeErrorCode } from '../types/errors';
import { createAckEnvelope, createNackEnvelope } from '../validators/envelope-validator';

export class WatchPartyHandler {
  constructor(private readonly gateway: RealtimeGateway) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    logger.debug('[WatchPartyHandler] Registering watch-party socket handlers...');

    this.gateway.registerHandler('playback.play', this.handlePlaybackPlay.bind(this));
    this.gateway.registerHandler('playback.pause', this.handlePlaybackPause.bind(this));
    this.gateway.registerHandler('playback.seek', this.handlePlaybackSeek.bind(this));
    this.gateway.registerHandler('playback.change_episode', this.handleChangeEpisode.bind(this));
    this.gateway.registerHandler('playback.sync', this.handlePlaybackSync.bind(this));

    logger.info('[WatchPartyHandler] Handlers successfully registered');
  }

  async handlePlaybackPlay(
    envelope: EventEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<any> {
    const channelId = envelope.data?.channelId;
    const timestamp = envelope.data?.atTimestamp;

    if (!channelId) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.PAYLOAD_INVALID,
          message: 'channelId is required',
        }),
      };
    }

    try {
      const container = require('../../config/container').default;
      const watchPartyService = container.resolve('watchPartyService');

      const updatedState = await watchPartyService.updatePlaybackState(
        channelId,
        BigInt(context.userId),
        { action: 'play', timestamp }
      );

      return {
        success: true,
        ack: createAckEnvelope(envelope.requestId, 'playback.play', updatedState),
        broadcast: {
          rooms: [`channel:${channelId}`],
          event: 'playback.state.changed',
          data: updatedState,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: error.code || RealtimeErrorCode.INTERNAL_ERROR,
          message: error.message || 'Failed to update playback state',
        }),
      };
    }
  }

  async handlePlaybackPause(
    envelope: EventEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<any> {
    const channelId = envelope.data?.channelId;
    const timestamp = envelope.data?.atTimestamp;

    if (!channelId) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.PAYLOAD_INVALID,
          message: 'channelId is required',
        }),
      };
    }

    try {
      const container = require('../../config/container').default;
      const watchPartyService = container.resolve('watchPartyService');

      const updatedState = await watchPartyService.updatePlaybackState(
        channelId,
        BigInt(context.userId),
        { action: 'pause', timestamp }
      );

      return {
        success: true,
        ack: createAckEnvelope(envelope.requestId, 'playback.pause', updatedState),
        broadcast: {
          rooms: [`channel:${channelId}`],
          event: 'playback.state.changed',
          data: updatedState,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: error.code || RealtimeErrorCode.INTERNAL_ERROR,
          message: error.message || 'Failed to update playback state',
        }),
      };
    }
  }

  async handlePlaybackSeek(
    envelope: EventEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<any> {
    const channelId = envelope.data?.channelId;
    const timestamp = envelope.data?.toTimestamp;

    if (!channelId || timestamp === undefined) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.PAYLOAD_INVALID,
          message: 'channelId and toTimestamp are required',
        }),
      };
    }

    try {
      const container = require('../../config/container').default;
      const watchPartyService = container.resolve('watchPartyService');

      const updatedState = await watchPartyService.updatePlaybackState(
        channelId,
        BigInt(context.userId),
        { action: 'seek', timestamp }
      );

      return {
        success: true,
        ack: createAckEnvelope(envelope.requestId, 'playback.seek', updatedState),
        broadcast: {
          rooms: [`channel:${channelId}`],
          event: 'playback.state.changed',
          data: updatedState,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: error.code || RealtimeErrorCode.INTERNAL_ERROR,
          message: error.message || 'Failed to update playback state',
        }),
      };
    }
  }

  async handleChangeEpisode(
    envelope: EventEnvelope,
    context: AuthenticatedSocketContext
  ): Promise<any> {
    const channelId = envelope.data?.channelId;
    const newSourceUrl = envelope.data?.newSourceUrl;
    const newEpisodeNumber = envelope.data?.newEpisodeNumber;

    if (!channelId || !newSourceUrl) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: RealtimeErrorCode.PAYLOAD_INVALID,
          message: 'channelId and newSourceUrl are required',
        }),
      };
    }

    try {
      const container = require('../../config/container').default;
      const watchPartyService = container.resolve('watchPartyService');

      const updatedState = await watchPartyService.updateRoomSource(
        channelId,
        BigInt(context.userId),
        newSourceUrl,
        newEpisodeNumber
      );

      return {
        success: true,
        ack: createAckEnvelope(envelope.requestId, 'playback.change_episode', updatedState),
        broadcast: {
          rooms: [`channel:${channelId}`],
          event: 'playback.source.changed',
          data: updatedState,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        nack: createNackEnvelope(envelope.requestId, {
          code: error.code || RealtimeErrorCode.INTERNAL_ERROR,
          message: error.message || 'Failed to change episode',
        }),
      };
    }
  }

  async handlePlaybackSync(
    envelope: EventEnvelope,
    _context: AuthenticatedSocketContext
  ): Promise<any> {
    // Telemetry only, no state mutation
    return {
      success: true,
      ack: createAckEnvelope(envelope.requestId, 'playback.sync'),
    };
  }
}
