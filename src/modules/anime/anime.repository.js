const BaseMediaRepository = require('../../core/base/BaseMediaRepository');

/**
 * Anime Repository
 * 
 * Handles data access for anime entities.
 * Extends BaseMediaRepository to inherit common media operations.
 * 
 * Features:
 * - External ID lookups 
 * - Anime upsert with metadata
 * - Inherited: CRUD, pagination, search, filtering
 * 
 * @extends BaseMediaRepository
 */
class AnimeRepository extends BaseMediaRepository {
  /**
   * Create anime repository instance
   * 
   * @param {Object} prisma - Prisma client instance (injected by DI container)
   */
  constructor(prisma) {
    super(prisma, 'animeMetadata');
  }

  /**
   * Find anime by AniList ID
   * 
   * @param {number} anilistId - AniList anime ID
   * @param {Object} [options={}] - Query options
   * @param {Object} [options.include] - Custom include (overrides default)
   * @param {Object} [options.select] - Fields to select
   * @returns {Promise<Object|null>} Anime with metadata or null
   */
  async findByAnilistId(anilistId, options = {}) {
    return this._findByExternalId('idAnilist', anilistId, options);
  }

  /**
   * Create or update anime entry
   * 
   * This method expects data already transformed by AnimeAdapter.
   * The adapter handles:
   * - Score normalization (0-100 → 0-10)
   * - Studio extraction
   * - Trailer URL building
   * - Field mapping
   * 
   * @param {Object} transformedData - Data from AnimeAdapter.fromAnilist()
   * @param {number} transformedData.idAnilist - AniList ID
   * @param {Object} transformedData.animeMetadata - Metadata object with create field
   * @returns {Promise<Object>} Created or updated anime with metadata
   * 
   * @example
   * // In service:
   * const anilistData = await anilistClient.fetchById(1);
   * const transformedData = animeAdapter.fromAnilist(anilistData);
   * const anime = await animeRepo.upsertAnime(transformedData);
   */
  async upsertAnime(transformedData) {
    const { idAnilist, animeMetadata, ...coreFields } = transformedData;

    return this.upsert(
      { idAnilist },
      {
        ...coreFields,
        idAnilist,
        type: 'ANIME',
        lastSyncedAt: new Date(),
        animeMetadata: {
          create: animeMetadata.create
        }
      },
      {
        ...coreFields,
        lastSyncedAt: new Date(),
        animeMetadata: {
          upsert: {
            create: animeMetadata.create,
            update: animeMetadata.create
          }
        }
      },
      {
        include: this._getDefaultInclude()
      }
    );
  }
}

module.exports = AnimeRepository;