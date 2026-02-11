import type { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { BaseMediaRepository } from '../../core/base/BaseMediaRepository';
import { MangaItem } from '../../entities';

/**
 * Manga create/update data structure
 */
interface MangaCreateData {
  idAnilist: number;
  idMal?: number | null;
  lastSyncedAt?: Date;
  titleRomaji: string;
  titleEnglish?: string | null;
  titleNative?: string | null;
  status: 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED';
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
  chapters?: number | null;
  volumes?: number | null;
  author?: Array<{ name: string; role: string }> | null;
  serialization?: string | null;
}

/**
 * Manga Repository
 *
 * Handles data access for manga entities.
 * Extends BaseMediaRepository to inherit common media operations.
 *
 * Features:
 * - External ID lookups
 * - Manga upsert with metadata
 * - Inherited: CRUD, pagination, search, filtering
 *
 * @extends BaseMediaRepository
 */
class MangaRepository extends BaseMediaRepository<MangaItem> {
  /**
   * Create manga repository instance
   *
   * @param repository - TypeORM repository instance (injected by DI container)
   */
  constructor(repository?: Repository<MangaItem>) {
    super(repository || AppDataSource.getRepository(MangaItem));
  }

  // ==================== IMediaRepository IMPLEMENTATIONS ====================
  async findByExternalId(externalId: number): Promise<MangaItem | null> {
    return this.findOne({ where: { idAnilist: externalId } as any });
  }

  async findManyByExternalIds(externalIds: number[]): Promise<MangaItem[]> {
    return this.findMany({ where: { idAnilist: externalIds as any } });
  }

  async countByQuery(filter: { query?: string }): Promise<number> {
    if (!filter.query) {
      return this.count();
    }
    const qb = this.repository.createQueryBuilder('manga');
    qb.where(
      'manga.titleRomaji LIKE :query OR manga.titleEnglish LIKE :query OR manga.titleNative LIKE :query',
      { query: `%${filter.query}%` }
    );
    return qb.getCount();
  }

  // ==================== PUBLIC API ====================
  async findByAnilistId(anilistId: number): Promise<MangaItem | null> {
    return this.findOne({ where: { idAnilist: anilistId } as any });
  }

  async findByAnilistIds(anilistIds: number[]): Promise<MangaItem[]> {
    return this.findMany({ where: { idAnilist: anilistIds as any } });
  }

  /**
   * Create or update manga entry
   * Expects data already transformed by MangaAdapter
   */
  async upsertManga(transformedData: MangaCreateData): Promise<MangaItem> {
    const { idAnilist, ...fields } = transformedData;

    const existing = await this.findByAnilistId(idAnilist);

    if (!existing) {
      return this.create({ idAnilist, ...fields, lastSyncedAt: new Date() } as any);
    }

    const updated = await this.update(existing.id, { ...fields, lastSyncedAt: new Date() } as any);

    if (!updated) {
      throw new Error(`Failed to update manga with idAnilist: ${idAnilist}`);
    }

    return updated;
  }
}

export { MangaRepository };
