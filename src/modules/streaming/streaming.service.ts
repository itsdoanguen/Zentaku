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
  AudioCategory,
  AvailableEpisodesResponse,
  EpisodeServersResponse,
  EpisodeSourcesResponse,
  StreamingServer,
  SyncHianimeIdResponse,
} from '../../core/types/streaming.types';
import type AniwatchClient from '../../infrastructure/external/aniwatch/AniwatchClient';
import type MalSyncClient from '../../infrastructure/external/malsync/MalSyncClient';
import { NotFoundError, ValidationError } from '../../shared/utils/error';
import type AnimeRepository from '../anime/anime.repository';
import type AnimeService from '../anime/anime.service';

class StreamingService extends BaseService implements IStreamingService {
  constructor(
    private readonly animeRepository: AnimeRepository,
    private readonly animeService: AnimeService,
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

    let anime = await this.animeRepository.findByAnilistId(validId);
    if (!anime) {
      this.logger.info(
        `[StreamingService] Anime ${validId} not found in DB, fetching from AniList...`
      );
      await this.animeService.getAnimeDetails(validId);
      anime = await this.animeRepository.findByAnilistId(validId);

      if (!anime) {
        throw new NotFoundError(
          `Anime with AniList ID ${validId} not found on AniList or failed to sync`
        );
      }
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

    this.logger.info(`[StreamingService] HiAnime ID found: ${hianimeId}, validating...`);
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
   * @param server - Streaming server (optional)
   * @param category - Audio category (optional)
   * @returns Episode sources with streaming links
   */
  async getEpisodeSources(
    anilistId: number,
    episodeNumber: number,
    server?: StreamingServer,
    category?: AudioCategory
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

    // Fetch all episodes (use high limit to get everything for finding specific episode)
    const episodesData = await this.aniwatchClient.getAnimeEpisodes(hianimeId, 1, 10000);
    const episode = episodesData.episodes.find((ep) => ep.number === validEpisodeNumber);

    if (!episode) {
      throw new NotFoundError(
        `Episode ${validEpisodeNumber} not found for anime ${validAnilistId}`
      );
    }

    this.logger.debug(`[StreamingService] Found episodeId: ${episode.episodeId}`);

    const sources = await this.aniwatchClient.getEpisodeSources(
      episode.episodeId,
      server,
      category
    );

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
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 100)
   * @returns List of available episodes with pagination
   */
  async getAvailableEpisodes(
    anilistId: number,
    page: number = 1,
    limit: number = 100
  ): Promise<AvailableEpisodesResponse> {
    const validId = this._validateId(anilistId, 'AniList ID');

    this.logger.info(
      `[StreamingService] Getting available episodes for AniList ID: ${validId} (page: ${page}, limit: ${limit})`
    );

    const hianimeId = await this._getOrSyncHianimeId(validId);

    const episodesData = await this.aniwatchClient.getAnimeEpisodes(hianimeId, page, limit);

    this.logger.debug(
      `[StreamingService] Found ${episodesData.episodes.length} episodes (page ${episodesData.pagination?.currentPage}/${episodesData.pagination?.totalPages})`
    );

    return {
      anilistId: validId,
      hianimeId,
      totalEpisodes: episodesData.totalEpisodes,
      episodes: episodesData.episodes,
      pagination: episodesData.pagination,
    };
  }

  /**
   * Get available servers for a specific episode
   *
   * @param anilistId - AniList anime ID
   * @param episodeNumber - Episode number
   * @returns Available servers for the episode
   */
  async getEpisodeServers(
    anilistId: number,
    episodeNumber: number
  ): Promise<EpisodeServersResponse> {
    const validAnilistId = this._validateId(anilistId, 'AniList ID');
    const validEpisodeNumber = this._validateId(episodeNumber, 'Episode Number');

    this.logger.info(`[StreamingService] Getting episode servers:`, {
      anilistId: validAnilistId,
      episodeNumber: validEpisodeNumber,
    });

    const hianimeId = await this._getOrSyncHianimeId(validAnilistId);

    // Get episodes list to find the real episodeId (use high limit to get all)
    const episodesData = await this.aniwatchClient.getAnimeEpisodes(hianimeId, 1, 10000);
    const episode = episodesData.episodes.find((ep) => ep.number === validEpisodeNumber);

    if (!episode) {
      throw new NotFoundError(
        `Episode ${validEpisodeNumber} not found for anime ${validAnilistId}`
      );
    }

    this.logger.debug(`[StreamingService] Found episodeId: ${episode.episodeId}`);

    const servers = await this.aniwatchClient.getEpisodeServers(episode.episodeId);

    this.logger.debug(
      `[StreamingService] Found servers - sub: ${servers.sub.length}, dub: ${servers.dub.length}, raw: ${servers.raw.length}`
    );

    return {
      ...servers,
      anilistId: validAnilistId,
      episodeNumber: validEpisodeNumber,
      hianimeId,
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
    let anime = await this.animeRepository.findByAnilistId(anilistId);

    if (!anime) {
      this.logger.debug(
        `[StreamingService] Anime ${anilistId} not found in DB, auto-syncing from AniList...`
      );
      await this.animeService.getAnimeDetails(anilistId);
      anime = await this.animeRepository.findByAnilistId(anilistId);

      if (!anime) {
        throw new NotFoundError(
          `Anime with AniList ID ${anilistId} not found on AniList or failed to sync`
        );
      }
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
