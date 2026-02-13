/* eslint-disable @typescript-eslint/no-explicit-any */
import { In, type Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { BaseMediaRepository } from '../../core/base/BaseMediaRepository';
import { ReadingMediaItem } from '../../entities';

export type MediaFormat = 'MANGA' | 'ONE_SHOT' | 'MANHWA' | 'MANHUA' | 'NOVEL' | 'LIGHT_NOVEL';

interface ReadingMediaCreateData {
  idAnilist: number;
  idMal?: number | null;
  idMangadex?: string | null;
  lastSyncedAt?: Date;
  titleRomaji: string;
  titleEnglish?: string | null;
  titleNative?: string | null;
  status: 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';
  coverImage?: string | null;
  bannerImage?: string | null;
  isAdult?: boolean;
  averageScore?: number | null;
  meanScore?: number | null;
  description?: string | null;
  synonyms?: string[] | null;
  genres?: string[] | null;
  tags?: unknown[] | null;
  popularity?: number | null;
  favorites?: number | null;
  format?: string | null; // NEW: Format field (MANGA, NOVEL, LIGHT_NOVEL, etc.)
  chapters?: number | null;
  volumes?: number | null;
  author?: Array<{ name: string; role: string }> | null;
  serialization?: string | null;
}

/**
 * Reading Media Repository
 *
 * Unified repository for both Manga and Novel reading media.
 * Uses format field for differentiation.
 * @extends BaseMediaRepository
 */
class ReadingMediaRepository extends BaseMediaRepository<ReadingMediaItem> {
  // Format constants
  static readonly MANGA_FORMATS: MediaFormat[] = ['MANGA', 'ONE_SHOT', 'MANHWA', 'MANHUA'];
  static readonly NOVEL_FORMATS: MediaFormat[] = ['NOVEL', 'LIGHT_NOVEL'];

  /**
   * Create reading media repository instance
   *
   * @param repository - TypeORM repository instance (injected by DI container)
   */
  constructor(repository?: Repository<ReadingMediaItem>) {
    super(repository || AppDataSource.getRepository(ReadingMediaItem));
  }

  // ==================== IMediaRepository IMPLEMENTATIONS ====================
  async findByExternalId(externalId: number): Promise<ReadingMediaItem | null> {
    return this.findOne({ where: { idAnilist: externalId } as any });
  }

  async findManyByExternalIds(externalIds: number[]): Promise<ReadingMediaItem[]> {
    return this.findMany({ where: { idAnilist: externalIds as any } });
  }

  /**
   * Count reading media by search query
   *
   * @param filter - Filter with optional query
   * @returns Count of reading media matching the query
   * @override
   */
  async countByQuery(filter: { query?: string }): Promise<number> {
    if (!filter.query) {
      return this.count();
    }
    const qb = this.repository.createQueryBuilder('media');
    qb.where(
      'media.titleRomaji LIKE :query OR media.titleEnglish LIKE :query OR media.titleNative LIKE :query',
      { query: `%${filter.query}%` }
    );
    return qb.getCount();
  }

  // ==================== PUBLIC API ====================
  async findByAnilistId(anilistId: number): Promise<ReadingMediaItem | null> {
    return this.findOne({ where: { idAnilist: anilistId } as any });
  }

  async findByAnilistIds(anilistIds: number[]): Promise<ReadingMediaItem[]> {
    return this.findMany({ where: { idAnilist: anilistIds as any } });
  }

  async findByMalId(malId: number): Promise<ReadingMediaItem | null> {
    return this._findByExternalId('idMal', malId);
  }

  async findByMangadexId(mangadexId: string): Promise<ReadingMediaItem | null> {
    return this._findByExternalId('idMangadex', mangadexId);
  }

  // ==================== FORMAT-BASED QUERIES ====================

  async findByFormat(formats: MediaFormat[], options = {}): Promise<ReadingMediaItem[]> {
    if (!Array.isArray(formats) || formats.length === 0) {
      return [];
    }

    return this.findMany({
      where: { format: In(formats) } as any,
      ...options,
    });
  }

  async findManga(options = {}): Promise<ReadingMediaItem[]> {
    return this.findByFormat(ReadingMediaRepository.MANGA_FORMATS, options);
  }

  async findNovels(options = {}): Promise<ReadingMediaItem[]> {
    return this.findByFormat(ReadingMediaRepository.NOVEL_FORMATS, options);
  }

  async countByFormat(formats: MediaFormat[]): Promise<number> {
    if (!Array.isArray(formats) || formats.length === 0) {
      return 0;
    }

    return this.count({ format: In(formats) } as any);
  }

  // ==================== UPSERT OPERATIONS ====================

  /**
   * Create or update reading media entry
   *
   * This method expects data already transformed by ReadingMediaAdapter.
   * The adapter handles:
   * - Format field mapping
   * - Score normalization
   * - Field mapping
   *
   * @param transformedData - Data from ReadingMediaAdapter.fromExternal()
   * @returns Created or updated reading media with metadata
   *
   * @example
   * // In service:
   * const anilistData = await anilistClient.fetchById(1);
   * const transformedData = readingMediaAdapter.fromExternal(anilistData);
   * const media = await readingMediaRepo.upsertMedia(transformedData);
   */
  async upsertMedia(transformedData: ReadingMediaCreateData): Promise<ReadingMediaItem> {
    const { idAnilist, ...fields } = transformedData;

    const existing = await this.findByAnilistId(idAnilist);

    if (!existing) {
      return this.create({
        idAnilist,
        ...fields,
        format: fields.format || null, // Ensure format is captured
        lastSyncedAt: new Date(),
      } as any);
    }

    const updated = await this.update(existing.id, {
      ...fields,
      format: fields.format || null, // Always update format
      lastSyncedAt: new Date(),
    } as any);

    if (!updated) {
      throw new Error(`Failed to update reading media with idAnilist: ${idAnilist}`);
    }

    return updated;
  }

  /**
   * Backward compatibility alias for upsertMedia
   * @deprecated Use upsertMedia instead
   */
  async upsertManga(transformedData: ReadingMediaCreateData): Promise<ReadingMediaItem> {
    return this.upsertMedia(transformedData);
  }

  /**
   * IMediaRepository interface compatibility alias
   * Required by BaseMediaService
   */
  async upsertAnime(transformedData: ReadingMediaCreateData): Promise<ReadingMediaItem> {
    return this.upsertMedia(transformedData);
  }

  // ==================== SPECIALIZED QUERIES ====================

  async findByGenre(genre: string): Promise<ReadingMediaItem[]> {
    const qb = this.repository.createQueryBuilder('media');
    qb.where('JSON_CONTAINS(media.genres, :genre)', { genre: JSON.stringify(genre) });
    return qb.getMany();
  }

  override async findReleasing(options = {}): Promise<ReadingMediaItem[]> {
    return this.findMany({ where: { status: 'RELEASING' } as any, ...options });
  }

  override async findFinished(options = {}): Promise<ReadingMediaItem[]> {
    return this.findMany({ where: { status: 'FINISHED' } as any, ...options });
  }

  async findBySerialization(serialization: string): Promise<ReadingMediaItem[]> {
    return this.findMany({ where: { serialization } as any });
  }

  async findByFormatAndStatus(formats: MediaFormat[], status: string): Promise<ReadingMediaItem[]> {
    if (!Array.isArray(formats) || formats.length === 0) {
      return [];
    }

    return this.findMany({
      where: {
        format: In(formats),
        status,
      } as any,
    });
  }
}

export default ReadingMediaRepository;
