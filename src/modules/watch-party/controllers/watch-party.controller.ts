import type { Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import type { AuthenticatedRequest } from '../../../core/base/BaseController';
import type { WatchPartyService } from '../services/watch-party.service';

export default class WatchPartyController {
  constructor(private readonly watchPartyService: WatchPartyService) {}

  public createWatchRoom = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          code: 'PAYLOAD_INVALID',
          message: 'Invalid request payload',
          details: errors.array(),
        });
        return;
      }

      const result = await this.watchPartyService.createWatchRoom(
        BigInt(req.user!.userId),
        req.body
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public getWatchRoom = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          code: 'PAYLOAD_INVALID',
          message: 'Invalid request parameters',
          details: errors.array(),
        });
        return;
      }

      const channelId = req.params.channelId as string;
      const result = await this.watchPartyService.getWatchRoom(channelId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public updatePlaybackState = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          code: 'PAYLOAD_INVALID',
          message: 'Invalid request payload',
          details: errors.array(),
        });
        return;
      }

      const channelId = req.params.channelId as string;
      const result = await this.watchPartyService.updatePlaybackState(
        channelId,
        BigInt(req.user!.userId),
        req.body
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public joinWatchRoom = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          code: 'PAYLOAD_INVALID',
          message: 'Invalid request parameters',
          details: errors.array(),
        });
        return;
      }

      const channelId = req.params.channelId as string;
      const result = await this.watchPartyService.joinWatchRoom(
        channelId,
        BigInt(req.user!.userId)
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public leaveWatchRoom = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          code: 'PAYLOAD_INVALID',
          message: 'Invalid request parameters',
          details: errors.array(),
        });
        return;
      }

      const channelId = req.params.channelId as string;
      const result = await this.watchPartyService.leaveWatchRoom(
        channelId,
        BigInt(req.user!.userId)
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public inviteToWatchRoom = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          code: 'PAYLOAD_INVALID',
          message: 'Invalid request payload',
          details: errors.array(),
        });
        return;
      }

      const channelId = req.params.channelId as string;
      const targetUserId = BigInt(req.body.targetUserId);
      const result = await this.watchPartyService.inviteToWatchRoom(
        channelId,
        BigInt(req.user!.userId),
        targetUserId
      );

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
