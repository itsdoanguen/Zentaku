const BaseRepository = require('./BaseRepository');

/**
 * Base Media Repository
 * 
 * Specialized repository for MediaItem entities with inheritance pattern.
 * Handles common operations for anime, manga, and novel repositories.
 * 
 * Features:
 * - Automatic metadata inclusion
 * - AniList/MAL ID lookups
 * - Sync status management
 * - Media type filtering
 * 
 * The MediaItem uses Single Table Inheritance pattern where:
 * - MediaItem is the base table
 * - AnimeMetadata, BookMetadata are optional 1-1 relations
 * - Type field discriminates between ANIME, MANGA, NOVEL
 * 
 * @extends BaseRepository
 */
class BaseMediaRepository extends BaseRepository {
  /**
   * Create a media repository instance
   * 
   * @param {Object} prisma - Prisma client instance
   * @param {string} metadataRelation - Name of metadata relation (e.g., 'animeMetadata', 'bookMetadata')
   * @throws {Error} If metadata relation name is not provided
   */
  constructor(prisma, metadataRelation) {
    super(prisma, 'mediaItem');
    
    if (!metadataRelation) {
      throw new Error('Metadata relation name is required for MediaRepository');
    }
    
    /**
     * Name of the metadata relation
     * @protected
     * @type {string}
     */
    this.metadataRelation = metadataRelation;
  }

  // ============================================
  // PROTECTED HELPERS
  // ============================================

  /**
   * Get default include for media queries
   * 
   * Automatically includes the specific metadata relation.
   * Override this method in child classes if different include is needed.
   * 
   * @protected
   * @returns {Object} Include object for Prisma queries
   */
  _getDefaultInclude() {
    return {
      [this.metadataRelation]: true
    };
  }

  /**
   * Merge user-provided options with default include
   * 
   * @protected
   * @param {Object} [options={}] - User-provided options
   * @returns {Object} Merged options
   */
  _mergeWithDefaultInclude(options = {}) {
    if (options.include) {
      // User provided custom include, respect it
      return options;
    }
    
    return {
      ...options,
      include: this._getDefaultInclude()
    };
  }

  // ============================================
  // PROTECTED GENERIC METHODS FOR EXTERNAL IDS
  // ============================================

  /**
   * Generic method to find media by external ID field
   * 
   * This is a protected helper method. Child classes should implement
   * public methods that call this (e.g., findByAnilistId, findByMalId).
   * 
   * @protected
   * @param {string} fieldName - Name of the ID field (e.g., 'idAnilist', 'idMal', 'idMangadex')
   * @param {number|string} value - ID value
   * @param {Object} [options={}] - Additional query options
   * @returns {Promise<Object|null>} Media item or null if not found
   * 
   * @example
   * // In AnimeRepository:
   * async findByAnilistId(anilistId, options = {}) {
   *   return this._findByExternalId('idAnilist', anilistId, options);
   * }
   */
  async _findByExternalId(fieldName, value, options = {}) {
    return this.findOne(
      { [fieldName]: value },
      this._mergeWithDefaultInclude(options)
    );
  }

  /**
   * Generic method to find multiple media by external ID field
   * 
   * This is a protected helper method. Child classes should implement
   * public batch methods that call this (e.g., findByAnilistIds).
   * 
   * @protected
   * @param {string} fieldName - Name of the ID field (e.g., 'idAnilist', 'idMal')
   * @param {Array<number|string>} values - Array of ID values
   * @param {Object} [options={}] - Additional query options
   * @returns {Promise<Object[]>} Array of media items
   * 
   * @example
   * // In AnimeRepository:
   * async findByAnilistIds(anilistIds, options = {}) {
   *   return this._findByExternalIds('idAnilist', anilistIds, options);
   * }
   */
  async _findByExternalIds(fieldName, values, options = {}) {
    if (!Array.isArray(values) || values.length === 0) {
      return [];
    }

    return this.findMany({
      where: {
        [fieldName]: { in: values }
      },
      ...this._mergeWithDefaultInclude(options)
    });
  }

  // ============================================
  // SYNC STATUS MANAGEMENT
  // ============================================

  /**
   * Check if media should be synced from external source
   * 
   * Returns true if:
   * - Media doesn't exist (null)
   * - Media never been synced (lastSyncedAt is null)
   * - Last sync was older than threshold
   * 
   * @param {Object|null} media - Media object from database
   * @param {number} [thresholdDays=7] - Number of days before re-sync
   * @returns {boolean} True if sync is needed
   * 
   * @example
   * const anime = await animeRepo.findByAnilistId(1);
   * if (animeRepo.shouldSync(anime, 7)) {
   *   // Fetch fresh data from AniList
   * }
   */
  shouldSync(media, thresholdDays = 7) {
    // No media exists
    if (!media) {
      return true;
    }

    // Never synced before
    if (!media.lastSyncedAt) {
      return true;
    }

    // Calculate days since last sync
    const lastSynced = new Date(media.lastSyncedAt);
    const now = new Date();
    const diffMs = now - lastSynced;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays >= thresholdDays;
  }

  /**
   * Update the lastSyncedAt timestamp
   * 
   * @param {number|bigint} id - Media database ID
   * @param {Date} [syncDate=new Date()] - Sync timestamp
   * @returns {Promise<Object>} Updated media
   * 
   * @example
   * await animeRepo.updateSyncTimestamp(anime.id);
   */
  async updateSyncTimestamp(id, syncDate = new Date()) {
    return this.update(
      { id },
      { lastSyncedAt: syncDate }
    );
  }

  // ============================================
  // MEDIA STATUS QUERIES
  // ============================================

  /**
   * Find media by status
   * 
   * @param {string} status - MediaStatus enum value (RELEASING, FINISHED, etc.)
   * @param {Object} [options={}] - Additional query options
   * @returns {Promise<Object[]>} Array of media items
   * 
   * @example
   * const airingAnime = await animeRepo.findByStatus('RELEASING', {
   *   orderBy: { averageScore: 'desc' },
   *   take: 20
   * });
   */
  async findByStatus(status, options = {}) {
    return this.findMany({
      where: { status },
      ...this._mergeWithDefaultInclude(options)
    });
  }

  /**
   * Find releasing (currently airing) media
   * 
   * @param {Object} [options={}] - Additional query options
   * @returns {Promise<Object[]>} Array of releasing media
   */
  async findReleasing(options = {}) {
    return this.findByStatus('RELEASING', options);
  }

  /**
   * Find finished media
   * 
   * @param {Object} [options={}] - Additional query options
   * @returns {Promise<Object[]>} Array of finished media
   */
  async findFinished(options = {}) {
    return this.findByStatus('FINISHED', options);
  }

  /**
   * Find upcoming media (not yet released)
   * 
   * @param {Object} [options={}] - Additional query options
   * @returns {Promise<Object[]>} Array of upcoming media
   */
  async findUpcoming(options = {}) {
    return this.findByStatus('NOT_YET_RELEASED', options);
  }

  // ============================================
  // SCORING & POPULARITY
  // ============================================

  /**
   * Find top rated media
   * 
   * @param {Object} [options={}] - Query options
   * @param {number} [options.limit=20] - Number of items to return
   * @param {number} [options.minScore] - Minimum average score filter
   * @returns {Promise<Object[]>} Array of top rated media
   * 
   * @example
   * const topAnime = await animeRepo.findTopRated({ limit: 10, minScore: 8.0 });
   */
  async findTopRated(options = {}) {
    const { limit = 20, minScore, ...restOptions } = options;

    const where = minScore 
      ? { averageScore: { gte: minScore } }
      : {};

    return this.findMany({
      where,
      orderBy: { averageScore: 'desc' },
      take: limit,
      ...this._mergeWithDefaultInclude(restOptions)
    });
  }
  // ============================================
  // ADULT CONTENT FILTERING
  // ============================================

  /**
   * Find media with adult content filter
   * 
   * @param {boolean} [includeAdult=false] - Whether to include adult content
   * @param {Object} [options={}] - Additional query options
   * @returns {Promise<Object[]>} Array of media items
   */
  async findWithAdultFilter(includeAdult = false, options = {}) {
    const where = includeAdult ? {} : { isAdult: false };

    return this.findMany({
      where,
      ...this._mergeWithDefaultInclude(options)
    });
  }

  // ============================================
  // METADATA-SPECIFIC OPERATIONS
  // ============================================

  /**
   * Get media with metadata relation by any external ID field
   * 
   * Ensures metadata is always included.
   * Use this when you need to guarantee metadata exists.
   * 
   * @protected
   * @param {string} fieldName - ID field name
   * @param {number|string} value - ID value
   * @returns {Promise<Object|null>} Media with metadata
   * 
   * @example
   * // In child class:
   * async getWithMetadata(anilistId) {
   *   return this._getWithMetadata('idAnilist', anilistId);
   * }
   */
  async _getWithMetadata(fieldName, value) {
    return this._findByExternalId(fieldName, value, {
      include: this._getDefaultInclude()
    });
  }

  // ============================================
  // SEARCH OPERATIONS
  // ============================================

  /**
   * Search media by title (case-insensitive)
   * 
   * Searches in romaji, english, and native titles.
   * 
   * @param {string} query - Search query
   * @param {Object} [options={}] - Additional query options
   * @param {number} [options.limit=20] - Max results
   * @returns {Promise<Object[]>} Array of matching media
   * 
   * @example
   * const results = await animeRepo.searchByTitle('naruto', { limit: 10 });
   */
  async searchByTitle(query, options = {}) {
    const { limit = 20, ...restOptions } = options;

    return this.findMany({
      where: {
        OR: [
          { titleRomaji: { contains: query, mode: 'insensitive' } },
          { titleEnglish: { contains: query, mode: 'insensitive' } },
          { titleNative: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: limit,
      orderBy: { averageScore: 'desc' },
      ...this._mergeWithDefaultInclude(restOptions)
    });
  }
}

module.exports = BaseMediaRepository;
