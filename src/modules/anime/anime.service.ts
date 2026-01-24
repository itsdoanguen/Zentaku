import type { ExternalIdField, MediaType } from '../../core/base/BaseMediaService';
import { BaseMediaService } from '../../core/base/BaseMediaService';
import type AnilistAnimeClient from '../../infrastructure/external/anilist/anime/AnilistAnimeClient';
import type AnilistCharacterClient from '../../infrastructure/external/anilist/character/AnilistCharacterClient';
import type AnilistStaffClient from '../../infrastructure/external/anilist/staff/AnilistStaffClient';
import type AnimeAdapter from './anime.adapter';
import type AnimeRepository from './anime.repository';

class AnimeService extends BaseMediaService {
  protected override readonly dbRepository: AnimeRepository;
  protected override readonly externalClient: AnilistAnimeClient;
  protected override readonly adapter: AnimeAdapter;
  protected override readonly characterClient?: AnilistCharacterClient;
  protected override readonly staffClient?: AnilistStaffClient;

  constructor(
    animeRepository: AnimeRepository,
    animeAdapter: AnimeAdapter,
    anilistAnimeClient: AnilistAnimeClient,
    anilistCharacterClient?: AnilistCharacterClient,
    anilistStaffClient?: AnilistStaffClient
  ) {
    super(
      animeRepository,
      anilistAnimeClient,
      animeAdapter,
      anilistCharacterClient,
      anilistStaffClient
    );
    this.dbRepository = animeRepository;
    this.externalClient = anilistAnimeClient;
    this.adapter = animeAdapter;
    this.characterClient = anilistCharacterClient;
    this.staffClient = anilistStaffClient;
  }

  getMediaType(): MediaType {
    return 'ANIME';
  }

  getExternalIdField(): ExternalIdField {
    return 'idAnilist';
  }

  async getAnimeDetails(anilistId: number): Promise<unknown> {
    return this.getDetails(anilistId);
  }

  async getAnimeOverview(anilistId: number): Promise<unknown> {
    return this.getOverview(anilistId);
  }

  /**
   * Get characters for anime with pagination
   *
   * @param anilistId - The Anilist ID of the anime
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 25)
   * @returns Characters data with pagination
   */
  async getAnimeCharacters(
    anilistId: number,
    page: number = 1,
    perPage: number = 25
  ): Promise<unknown> {
    return this.getCharacters(anilistId, page, perPage);
  }

  /**
   * Get staff for anime with pagination
   *
   * @param anilistId - The Anilist ID of the anime
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 25)
   * @returns Staff data with pagination
   */
  async getAnimeStaff(anilistId: number, page: number = 1, perPage: number = 25): Promise<unknown> {
    return this.getStaff(anilistId, page, perPage);
  }

  /**
   * Get statistics for anime
   * Includes: rankings, score distribution, status distribution
   *
   * @param anilistId - The Anilist ID of the anime
   * @returns Anime statistics
   */
  async getAnimeStatistics(anilistId: number): Promise<unknown> {
    return this.getStatistics(anilistId);
  }

  /**
   * Get streaming platforms information for anime
   * Anime-specific feature - returns list of platforms where anime can be watched
   *
   * @param anilistId - The Anilist ID of the anime
   * @returns Streaming episodes data
   */
  async getWhereToWatch(anilistId: number): Promise<unknown> {
    const context = `getWhereToWatch(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'Anime ID');

      this._logInfo('Fetching anime streaming platforms', { anilistId });

      const streamingData = await this.externalClient.fetchWhereToWatch(anilistId);

      this._logInfo('Successfully fetched streaming platforms', {
        anilistId,
        platformCount: streamingData.length,
      });

      return streamingData;
    }, context);
  }
}

export default AnimeService;
