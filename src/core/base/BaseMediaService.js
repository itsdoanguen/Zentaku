const BaseService = require('./BaseService');

/**
 * Abstract Base Media Service
 * Specialized base class for media-related services (Anime, Manga, Novel)
 *
 * Implements Template Method Pattern for media synchronization workflow
 *
 * Features:
 * - Data sync from external APIs (AniList)
 * - Cache/sync threshold management
 * - Template method for standardized media retrieval
 * - Abstract methods for type-specific implementations
 *
 * Subclasses must implement:
 * - getMediaType() - Return media type string
 * - transformFromExternal() - Transform external API data to internal format
 * - formatResponse() - Format database data to API response
 *
 * @extends BaseService
 * @abstract
 */
class BaseMediaService extends BaseService {
  /**
   * @param {Object} dbRepository - Database repository for media storage
   * @param {Object} externalClient - External API client (e.g., AnilistClient)
   * @param {Object} adapter - Data adapter for transformations
   */
  constructor(dbRepository, externalClient, adapter) {
    super();

    if (new.target === BaseMediaService) {
      throw new Error('Cannot instantiate abstract class BaseMediaService directly');
    }

    // DI
    this.dbRepository = dbRepository;
    this.externalClient = externalClient;
    this.adapter = adapter;

    // Sync configuration
    this.syncThresholdDays = 7;
    this.cacheEnabled = true;
  }

  // ==================== ABSTRACT METHODS ====================

  /**
   * Get media type identifier
   * @returns {string} Media type (ANIME, MANGA, NOVEL)
   * @abstract
   */
  getMediaType() {
    throw new Error('Method getMediaType() must be implemented by subclass');
  }

  /**
   * Get external ID field name for the media type
   * @returns {string} Field name (e.g., 'idAnilist', 'idMal')
   * @abstract
   */
  getExternalIdField() {
    throw new Error('Method getExternalIdField() must be implemented by subclass');
  }

  // ==================== TEMPLATE METHOD PATTERN ====================

  /**
   * Get media details by external ID (Template Method)
   * Defines the skeleton of the algorithm to get media details
   *
   * @param {number} externalId - External API ID (e.g., AniList ID)
   * @returns {Promise<Object>} Formatted media data
   * @throws {NotFoundError} If media not found
   * @throws {ValidationError} If ID invalid
   */
  async getDetails(externalId) {
    const context = `getDetails(${externalId})`;

    return this._executeWithErrorHandling(async () => {
      // Validate input
      this._validateId(externalId, `${this.getMediaType()} ID`);

      this._logInfo(`Fetching ${this.getMediaType()} details`, { externalId });

      // Get from database
      let media = await this._getFromDatabase(externalId);

      // Check if sync needed and perform sync
      if (this._shouldSync(media)) {
        media = await this._syncFromExternal(externalId, media);
      }

      if (!media) {
        const { NotFoundError } = require('../../shared/utils/error');
        throw new NotFoundError(`${this.getMediaType()} with ID ${externalId} not found`);
      }

      // Format response using adapter
      const formatted = this.adapter.toResponse(media);

      this._logInfo(`Successfully fetched ${this.getMediaType()}`, {
        externalId,
        wasSynced: this._shouldSync(media),
      });

      return formatted;
    }, context);
  }

  // ==================== SYNC LOGIC METHODS ====================

  /**
   * Check if media data should be synced from external API
   *
   * Sync is needed when:
   * - Media doesn't exist in database
   * - Media never synced before (lastSyncedAt is null)
   * - Media data is stale (older than syncThresholdDays)
   *
   * @param {Object|null} media - Media data from database
   * @returns {boolean} True if sync needed
   * @protected
   */
  _shouldSync(media) {
    if (!media) {
      this._logDebug('Sync needed: media not found in database');
      return true;
    }

    // Never synced before
    if (!media.lastSyncedAt) {
      this._logDebug('Sync needed: media never synced');
      return true;
    }

    // Check if data is stale
    const isStale = this._isOlderThan(media.lastSyncedAt, this.syncThresholdDays);

    if (isStale) {
      const daysSinceSync = this._daysBetween(new Date(media.lastSyncedAt), new Date());
      this._logDebug('Sync needed: data is stale', {
        daysSinceSync,
        threshold: this.syncThresholdDays,
      });
    }

    return isStale;
  }

  /**
   * Sync media data from external API and save to database
   *
   * Process:
   * 1. Fetch data from external API
   * 2. Transform to internal format using adapter
   * 3. Upsert to database
   * 4. Return updated media
   *
   * Fallback: If sync fails and cached data exists, use cached data
   *
   * @param {number} externalId - External API ID
   * @param {Object|null} existingMedia - Existing media data (for fallback)
   * @returns {Promise<Object>} Synced media data
   * @protected
   */
  async _syncFromExternal(externalId, existingMedia = null) {
    try {
      this._logInfo(`Syncing ${this.getMediaType()} from external API`, { externalId });

      // Fetch from external API (polymorphic - different for each media type)
      const externalData = await this._fetchFromExternalAPI(externalId);

      if (!externalData) {
        const { NotFoundError } = require('../../shared/utils/error');
        throw new NotFoundError(
          `${this.getMediaType()} with ID ${externalId} not found on external API`
        );
      }

      // Transform using adapter
      const transformedData = this.adapter.fromAnilist(externalData);

      // Add sync metadata
      transformedData.lastSyncedAt = new Date();
      transformedData.type = this.getMediaType();

      const syncedMedia = await this.dbRepository.upsertAnime(transformedData);

      this._logInfo(`Successfully synced ${this.getMediaType()}`, {
        externalId,
        mediaId: syncedMedia.id,
      });

      return syncedMedia;
    } catch (error) {
      // Fallback to cached data if available
      if (existingMedia) {
        this._logWarn(`Sync failed for ${this.getMediaType()}, using cached data`, {
          externalId,
          error: error.message,
          cacheAge: this._daysBetween(new Date(existingMedia.lastSyncedAt), new Date()),
        });
        return existingMedia;
      }

      // No cached data, propagate error
      this._logError(`Sync failed for ${this.getMediaType()} and no cache available`, {
        externalId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Fetch data from external API
   * Delegates to appropriate external client method based on media type
   *
   * @param {number} externalId - ExternOal API ID
   * @returns {Promise<Object>} External API response
   * @protected
   */
  async _fetchFromExternalAPI(externalId) {
    return this.externalClient.fetchById(externalId);
  }

  /**
   * Get media from database by external ID
   *
   * @param {number} externalId - External API ID
   * @returns {Promise<Object|null>} Media from database or null
   * @protected
   */
  async _getFromDatabase(externalId) {
    try {
      // Use repository's findById method
      const media = await this.dbRepository.findById(externalId);

      if (media) {
        this._logDebug(`Found ${this.getMediaType()} in database`, { externalId });
      } else {
        this._logDebug(`${this.getMediaType()} not found in database`, { externalId });
      }

      return media;
    } catch (error) {
      this._logError(`Error fetching ${this.getMediaType()} from database`, {
        externalId,
        error: error.message,
      });
      throw error;
    }
  }

  // ==================== SEARCH & LIST METHODS ====================

  /**
   * Search media by query
   * Template method for search operations
   *
   * @param {string} query - Search query
   * @param {number} page - Page number
   * @param {number} perPage - Items per page
   * @returns {Promise<Object>} Search results with pagination
   */
  async search(query, page = 1, perPage = 20) {
    const context = `search("${query}")`;

    return this._executeWithErrorHandling(async () => {
      // Validate query
      this._validateString(query, 'Search query', { minLength: 1, maxLength: 100 });

      // Get pagination params
      const pagination = this._getPagination(page, perPage);

      this._logInfo(`Searching ${this.getMediaType()}`, { query, page, perPage });

      // Search in database first
      const results = await this.dbRepository.search(query, pagination);

      // Format results
      const formattedResults = results.map((item) => this.adapter.toResponse(item));

      // Get total count for pagination
      const total = await this.dbRepository.count({ query });

      return {
        items: formattedResults,
        pagination: this._buildPaginationMeta(page, perPage, total),
      };
    }, context);
  }

  /**
   * Get trending media
   * Can be overridden by subclasses for specific implementations
   *
   * @param {number} page - Page number
   * @param {number} perPage - Items per page
   * @returns {Promise<Object>} Trending media with pagination
   */
  async getTrending(page = 1, perPage = 20) {
    const context = 'getTrending()';

    return this._executeWithErrorHandling(async () => {
      const pagination = this._getPagination(page, perPage);

      this._logInfo(`Fetching trending ${this.getMediaType()}`, { page, perPage });

      // Fetch from external API
      const trendingData = await this.externalClient.getTrending(this.getMediaType(), pagination);

      // Transform and format
      const formatted = trendingData.map((item) =>
        this.adapter.toResponse(this.adapter.fromExternal(item))
      );

      return {
        items: formatted,
        pagination: this._buildPaginationMeta(page, perPage, formatted.length),
      };
    }, context);
  }

  // ==================== BATCH OPERATIONS ====================

  /**
   * Get multiple media by IDs
   * Efficiently fetch and sync multiple media items
   *
   * @param {number[]} externalIds - Array of external IDs
   * @returns {Promise<Object[]>} Array of formatted media
   */
  async getMany(externalIds) {
    const context = 'getMany()';

    return this._executeWithErrorHandling(async () => {
      this._logInfo(`Fetching multiple ${this.getMediaType()}`, {
        count: externalIds.length,
      });

      // Fetch all from database
      const mediaItems = await this.dbRepository.findMany(externalIds);

      // Check which need sync
      const needSync = mediaItems.filter((m) => this._shouldSync(m));

      // Sync if needed
      if (needSync.length > 0) {
        this._logInfo(`Syncing ${needSync.length} ${this.getMediaType()} items`);

        await Promise.all(
          needSync.map((m) => this._syncFromExternal(m[this.getExternalIdField()], m))
        );
      }

      // Re-fetch after sync
      const updatedItems = await this.dbRepository.findMany(externalIds);

      // Format responses
      return updatedItems.map((item) => this.adapter.toResponse(item));
    }, context);
  }

  // ==================== CONFIGURATION METHODS ====================

  /**
   * Set sync threshold in days
   * @param {number} days - Number of days before re-sync
   */
  setSyncThreshold(days) {
    this._validateId(days, 'Sync threshold days');
    this.syncThresholdDays = days;
    this._logInfo(`Sync threshold updated to ${days} days`);
  }

  /**
   * Enable/disable caching
   * @param {boolean} enabled - Cache enabled flag
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
    this._logInfo(`Cache ${enabled ? 'enabled' : 'disabled'}`);
  }
}

module.exports = BaseMediaService;
