import type { ExternalIdField, MediaType } from '../../core/base/BaseMediaService';
import { BaseMediaService } from '../../core/base/BaseMediaService';
import type AnilistAnimeClient from '../../infrastructure/external/anilist/AnilistAnimeClient';
import type AnimeAdapter from './anime.adapter';
import type AnimeRepository from './anime.repository';

/**
 * Anime Service
 * Business logic layer for anime operations
 *
 * Extends BaseMediaService with anime-specific implementations
 * Uses dependency injection for better testability
 *
 * @extends BaseMediaService
 */
class AnimeService extends BaseMediaService {
  protected override readonly dbRepository: AnimeRepository;
  protected override readonly externalClient: AnilistAnimeClient;
  protected override readonly adapter: AnimeAdapter;

  /**
   * Constructor with dependency injection
   *
   * @param animeRepository - Anime database repository
   * @param animeAdapter - Anime data adapter
   * @param anilistAnimeClient - AniList API client
   */
  constructor(
    animeRepository: AnimeRepository,
    animeAdapter: AnimeAdapter,
    anilistAnimeClient: AnilistAnimeClient
  ) {
    super(animeRepository, anilistAnimeClient, animeAdapter);
    this.dbRepository = animeRepository;
    this.externalClient = anilistAnimeClient;
    this.adapter = animeAdapter;
  }

  // ==================== ABSTRACT METHOD IMPLEMENTATIONS ====================

  /**
   * Get media type identifier
   *
   * @returns ANIME
   * @override
   */
  getMediaType(): MediaType {
    return 'ANIME';
  }

  /**
   * Get external ID field name
   *
   * @returns idAnilist
   * @override
   */
  getExternalIdField(): ExternalIdField {
    return 'idAnilist';
  }

  // ==================== PUBLIC API ====================

  /**
   * Get anime details by Anilist ID.
   * Delegates to base class getDetails() template method
   *
   * @param anilistId - The Anilist ID of the anime
   * @returns Formatted anime details
   * @throws {NotFoundError} If anime not found
   * @throws {ValidationError} If ID invalid
   */
  async getAnimeDetails(anilistId: number): Promise<unknown> {
    return this.getDetails(anilistId);
  }
}

export default AnimeService;
