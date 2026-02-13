/**
 * Reading Media Service
 * Business logic layer for reading media operations (Manga & Novel)
 *
 * Extends BaseMediaService with format-specific implementations
 * Handles both manga and novel formats using format field differentiation
 */

import type { ExternalIdField, MediaType } from '../../core/base/BaseMediaService';
import { BaseMediaService } from '../../core/base/BaseMediaService';
import type AnilistCharacterClient from '../../infrastructure/external/anilist/character/AnilistCharacterClient';
import type AnilistReadingMediaClient from '../../infrastructure/external/anilist/reading-media/AnilistReadingMediaClient';
import type AnilistStaffClient from '../../infrastructure/external/anilist/staff/AnilistStaffClient';
import type ReadingMediaAdapter from './reading-media.adapter';
import type ReadingMediaRepository from './reading-media.repository';

// Format constants for differentiation
const MANGA_FORMATS = ['MANGA', 'ONE_SHOT'] as const;
const NOVEL_FORMATS = ['NOVEL'] as const;

type MangaFormat = (typeof MANGA_FORMATS)[number];
type NovelFormat = (typeof NOVEL_FORMATS)[number];

class ReadingMediaService extends BaseMediaService {
  protected override readonly dbRepository: ReadingMediaRepository;
  protected override readonly externalClient: AnilistReadingMediaClient;
  protected override readonly adapter: ReadingMediaAdapter;
  protected override readonly characterClient?: AnilistCharacterClient;
  protected override readonly staffClient?: AnilistStaffClient;

  constructor(
    readingMediaRepository: ReadingMediaRepository,
    readingMediaAdapter: ReadingMediaAdapter,
    anilistReadingMediaClient: AnilistReadingMediaClient,
    anilistCharacterClient?: AnilistCharacterClient,
    anilistStaffClient?: AnilistStaffClient
  ) {
    super(
      readingMediaRepository,
      anilistReadingMediaClient,
      readingMediaAdapter,
      anilistCharacterClient,
      anilistStaffClient
    );
    this.dbRepository = readingMediaRepository;
    this.externalClient = anilistReadingMediaClient;
    this.adapter = readingMediaAdapter;
    this.characterClient = anilistCharacterClient;
    this.staffClient = anilistStaffClient;
  }

  // ==================== ABSTRACT METHOD IMPLEMENTATIONS ====================

  getMediaType(): MediaType {
    return 'MANGA';
  }

  getExternalIdField(): ExternalIdField {
    return 'idAnilist';
  }

  // ==================== FORMAT VALIDATION ====================

  /**
   * Validate if format matches expected format group
   * @throws Error if format doesn't match expected group
   */
  private validateFormat(
    actualFormat: string | null | undefined,
    expectedGroup: 'manga' | 'novel',
    context: string
  ): void {
    if (!actualFormat) {
      this._logWarn('Media has no format field', { context });
      return;
    }

    const isMangaFormat = MANGA_FORMATS.includes(actualFormat as MangaFormat);
    const isNovelFormat = NOVEL_FORMATS.includes(actualFormat as NovelFormat);

    if (expectedGroup === 'manga' && !isMangaFormat) {
      throw new Error(
        `Format mismatch: Expected manga format but got '${actualFormat}'. This is a novel, use /novel endpoint instead.`
      );
    }

    if (expectedGroup === 'novel' && !isNovelFormat) {
      throw new Error(
        `Format mismatch: Expected novel format but got '${actualFormat}'. This is a manga, use /manga endpoint instead.`
      );
    }
  }

  // ==================== MANGA-SPECIFIC METHODS ====================

  async getMangaDetails(anilistId: number): Promise<unknown> {
    const context = `getMangaDetails(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'AniList ID');
      this._logInfo('Fetching manga details', { anilistId });

      const details = await this.getDetails(anilistId);

      // Validate format after fetching
      const media = details as { format?: string };
      this.validateFormat(media.format, 'manga', context);

      this._logInfo('Successfully fetched manga details', { anilistId });
      return details;
    }, context);
  }

  async getMangaOverview(anilistId: number): Promise<unknown> {
    const context = `getMangaOverview(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'AniList ID');
      this._logInfo('Fetching manga overview', { anilistId });

      const overview = await this.getOverview(anilistId);

      const media = overview as { format?: string };
      this.validateFormat(media.format, 'manga', context);

      this._logInfo('Successfully fetched manga overview', { anilistId });
      return overview;
    }, context);
  }

  async getMangaCharacters(
    anilistId: number,
    page: number = 1,
    perPage: number = 25
  ): Promise<unknown> {
    const context = `getMangaCharacters(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'AniList ID');
      this._logInfo('Fetching manga characters', { anilistId, page, perPage });

      // Validate format first
      const media = await this.dbRepository.findByAnilistId(anilistId);
      if (media) {
        this.validateFormat(media.format, 'manga', context);
      }

      const characters = await this.getCharacters(anilistId, page, perPage);

      this._logInfo('Successfully fetched manga characters', { anilistId });
      return characters;
    }, context);
  }

  async getMangaStaff(anilistId: number, page: number = 1, perPage: number = 25): Promise<unknown> {
    const context = `getMangaStaff(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'AniList ID');
      this._logInfo('Fetching manga staff', { anilistId, page, perPage });

      const media = await this.dbRepository.findByAnilistId(anilistId);
      if (media) {
        this.validateFormat(media.format, 'manga', context);
      }

      const staff = await this.getStaff(anilistId, page, perPage);

      this._logInfo('Successfully fetched manga staff', { anilistId });
      return staff;
    }, context);
  }

  async getMangaStatistics(anilistId: number): Promise<unknown> {
    const context = `getMangaStatistics(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'AniList ID');
      this._logInfo('Fetching manga statistics', { anilistId });

      const media = await this.dbRepository.findByAnilistId(anilistId);
      if (media) {
        this.validateFormat(media.format, 'manga', context);
      }

      const statistics = await this.getStatistics(anilistId);

      this._logInfo('Successfully fetched manga statistics', { anilistId });
      return statistics;
    }, context);
  }

  // ==================== NOVEL-SPECIFIC METHODS ====================

  async getNovelDetails(anilistId: number): Promise<unknown> {
    const context = `getNovelDetails(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'AniList ID');
      this._logInfo('Fetching novel details', { anilistId });

      const details = await this.getDetails(anilistId);

      const media = details as { format?: string };
      this.validateFormat(media.format, 'novel', context);

      this._logInfo('Successfully fetched novel details', { anilistId });
      return details;
    }, context);
  }

  async getNovelOverview(anilistId: number): Promise<unknown> {
    const context = `getNovelOverview(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'AniList ID');
      this._logInfo('Fetching novel overview', { anilistId });

      const overview = await this.getOverview(anilistId);

      const media = overview as { format?: string };
      this.validateFormat(media.format, 'novel', context);

      this._logInfo('Successfully fetched novel overview', { anilistId });
      return overview;
    }, context);
  }

  async getNovelCharacters(
    anilistId: number,
    page: number = 1,
    perPage: number = 25
  ): Promise<unknown> {
    const context = `getNovelCharacters(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'AniList ID');
      this._logInfo('Fetching novel characters', { anilistId, page, perPage });

      const media = await this.dbRepository.findByAnilistId(anilistId);
      if (media) {
        this.validateFormat(media.format, 'novel', context);
      }

      const characters = await this.getCharacters(anilistId, page, perPage);

      this._logInfo('Successfully fetched novel characters', { anilistId });
      return characters;
    }, context);
  }

  async getNovelStaff(anilistId: number, page: number = 1, perPage: number = 25): Promise<unknown> {
    const context = `getNovelStaff(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'AniList ID');
      this._logInfo('Fetching novel staff', { anilistId, page, perPage });

      const media = await this.dbRepository.findByAnilistId(anilistId);
      if (media) {
        this.validateFormat(media.format, 'novel', context);
      }

      const staff = await this.getStaff(anilistId, page, perPage);

      this._logInfo('Successfully fetched novel staff', { anilistId });
      return staff;
    }, context);
  }

  async getNovelStatistics(anilistId: number): Promise<unknown> {
    const context = `getNovelStatistics(${anilistId})`;

    return this._executeWithErrorHandling(async () => {
      this._validateId(anilistId, 'AniList ID');
      this._logInfo('Fetching novel statistics', { anilistId });

      const media = await this.dbRepository.findByAnilistId(anilistId);
      if (media) {
        this.validateFormat(media.format, 'novel', context);
      }

      const statistics = await this.getStatistics(anilistId);

      this._logInfo('Successfully fetched novel statistics', { anilistId });
      return statistics;
    }, context);
  }

  // ==================== SEARCH METHODS ====================

  /**
   * Search reading media by format group
   */
  async searchByFormatGroup(
    query: string,
    formatGroup: 'manga' | 'novel',
    page: number = 1,
    perPage: number = 25
  ): Promise<unknown> {
    const context = `searchByFormatGroup(${formatGroup})`;

    return this._executeWithErrorHandling(async () => {
      this._logInfo('Searching reading media by format group', {
        query,
        formatGroup,
        page,
        perPage,
      });

      const formats = formatGroup === 'manga' ? [...MANGA_FORMATS] : [...NOVEL_FORMATS];

      const results = await this.externalClient.search(query, { formats, page, perPage });

      this._logInfo('Successfully searched reading media', {
        formatGroup,
        resultCount: results?.media?.length || 0,
      });

      return results;
    }, context);
  }

  /**
   * Search manga only
   */
  async searchManga(query: string, page: number = 1, perPage: number = 25): Promise<unknown> {
    return this.searchByFormatGroup(query, 'manga', page, perPage);
  }

  /**
   * Search novels only
   */
  async searchNovels(query: string, page: number = 1, perPage: number = 25): Promise<unknown> {
    return this.searchByFormatGroup(query, 'novel', page, perPage);
  }
}

export default ReadingMediaService;
