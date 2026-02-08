/**
 * Streaming Service
 *
 * Service layer for streaming operations.
 * Inherits from BaseService for validation, logging, and error handling.
 *
 * @extends BaseService
 */

import { BaseService } from '../../core/base/BaseService';
import type { IStreamingService } from '../../core/interfaces/IStreamingService';
import type {
  AvailableEpisodesResponse,
  EpisodeSourcesResponse,
  SyncHianimeIdResponse,
} from '../../core/types/streaming.types';
import type AniwatchClient from '../../infrastructure/external/aniwatch/AniwatchClient';
import type MalSyncClient from '../../infrastructure/external/malsync/MalSyncClient';
import { NotFoundError, ValidationError } from '../../shared/utils/error';
import type AnimeRepository from '../anime/anime.repository';

class StreamingService extends BaseService implements IStreamingService {
  constructor(
    private readonly animeRepository: AnimeRepository,
    private readonly malSyncClient: MalSyncClient,
    private readonly aniwatchClient: AniwatchClient
  ) {
    super();
    this.logger.info('[StreamingService] Initialized');
  }

  /**
   * Sync HiAnime ID for an anime using MALSync
   *
   * @param anilistId - AniList anime ID
   * @returns Sync result with HiAnime ID
   */
  async syncHianimeId(anilistId: number): Promise<SyncHianimeIdResponse> {
    const validId = this._validateId(anilistId, 'AniList ID');

    this.logger.info(`[StreamingService] Syncing HiAnime ID for AniList ID: ${validId}`);

    const anime = await this.animeRepository.findByAnilistId(validId);
    if (!anime) {
      throw new NotFoundError(`Anime with AniList ID ${validId} not found in database`);
    }

    if (anime.idHianime) {
      this.logger.debug(`[StreamingService] HiAnime ID already exists: ${anime.idHianime}`);
      return {
        anilistId: validId,
        hianimeId: anime.idHianime,
        wasSynced: false,
        source: 'database',
      };
    }

    const hianimeId = await this.malSyncClient.getHianimeIdByAnilistId(validId);

    if (!hianimeId) {
      throw new NotFoundError(`Anime with AniList ID ${validId} not available on HiAnime`);
    }

    // Validate HiAnime ID format and length before saving
    this._validateHianimeId(hianimeId);

    await this.animeRepository.updateHianimeId(validId, hianimeId);

    this.logger.info(`[StreamingService] HiAnime ID synced: ${hianimeId}`);

    return {
      anilistId: validId,
      hianimeId,
      wasSynced: true,
      source: 'malsync',
    };
  }

  /**
   * Get streaming sources for a specific episode
   *
   * @param anilistId - AniList anime ID
   * @param episodeNumber - Episode number
   * @param server - Streaming server (default: "hd-1")
   * @param category - Audio category (default: "sub")
   * @returns Episode sources with streaming links
   */
  async getEpisodeSources(
    anilistId: number,
    episodeNumber: number,
    server: string = 'hd-1',
    category: 'sub' | 'dub' | 'raw' = 'sub'
  ): Promise<EpisodeSourcesResponse> {
    const validAnilistId = this._validateId(anilistId, 'AniList ID');
    const validEpisodeNumber = this._validateId(episodeNumber, 'Episode Number');

    this.logger.info(`[StreamingService] Getting episode sources:`, {
      anilistId: validAnilistId,
      episodeNumber: validEpisodeNumber,
      server,
      category,
    });

    const hianimeId = await this._getOrSyncHianimeId(validAnilistId);

    const episodeId = this.aniwatchClient.buildEpisodeId(hianimeId, validEpisodeNumber);

    const sources = await this.aniwatchClient.getEpisodeSources(episodeId, server, category);

    this.logger.debug(`[StreamingService] Sources fetched successfully`);

    return {
      ...sources,
      anilistId: validAnilistId,
      episodeNumber: validEpisodeNumber,
      hianimeId,
    };
  }

  /**
   * Get available episodes for an anime
   *
   * @param anilistId - AniList anime ID
   * @returns List of available episodes
   */
  async getAvailableEpisodes(anilistId: number): Promise<AvailableEpisodesResponse> {
    const validId = this._validateId(anilistId, 'AniList ID');

    this.logger.info(`[StreamingService] Getting available episodes for AniList ID: ${validId}`);

    const hianimeId = await this._getOrSyncHianimeId(validId);

    const episodesData = await this.aniwatchClient.getAnimeEpisodes(hianimeId);

    this.logger.debug(`[StreamingService] Found ${episodesData.totalEpisodes} episodes`);

    return {
      anilistId: validId,
      hianimeId,
      totalEpisodes: episodesData.totalEpisodes,
      episodes: episodesData.episodes,
    };
  }

  /**
   * Get HiAnime ID from database or sync from MALSync
   *
   * @private
   * @param anilistId - AniList anime ID
   * @returns HiAnime identifier
   */
  private async _getOrSyncHianimeId(anilistId: number): Promise<string> {
    const anime = await this.animeRepository.findByAnilistId(anilistId);

    if (!anime) {
      throw new NotFoundError(`Anime with AniList ID ${anilistId} not found in database`);
    }

    if (anime.idHianime) {
      return anime.idHianime;
    }

    this.logger.debug(`[StreamingService] HiAnime ID not found, syncing...`);
    const syncResult = await this.syncHianimeId(anilistId);
    return syncResult.hianimeId;
  }

  /**
   * Validate HiAnime identifier format and length
   *
   * @private
   * @param hianimeId - HiAnime identifier to validate
   * @throws {ValidationError} If identifier is invalid
   *
   * @remarks
   * HiAnime ID can be:
   * - Numeric: "100"
   * - Slug: "one-piece-100"
   * - Must be <= 100 characters (database constraint)
   * - Must not contain special characters except hyphen
   */
  private _validateHianimeId(hianimeId: string | null): void {
    if (!hianimeId || hianimeId.trim().length === 0) {
      throw new ValidationError('HiAnime ID cannot be empty');
    }

    if (hianimeId.length > 100) {
      throw new ValidationError(
        `HiAnime ID is too long (${hianimeId.length} chars). Maximum is 100 characters.`
      );
    }

    const validFormatRegex = /^[a-zA-Z0-9-?=]+$/;
    if (!validFormatRegex.test(hianimeId)) {
      throw new ValidationError(
        'HiAnime ID contains invalid characters. Only alphanumeric, hyphens, and query params are allowed.'
      );
    }

    this.logger.debug(`[StreamingService] HiAnime ID validated: ${hianimeId}`);
  }
}

export default StreamingService;
