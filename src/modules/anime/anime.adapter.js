/**
 * Anime Adapter
 *
 * Transforms data between different representations:
 * - AniList API GraphQL response → Prisma Database format
 * - Prisma Database model → API Response format
 *
 * @module AnimeAdapter
 */

class AnimeAdapter {
  // ============================================
  // ANILIST API → DATABASE FORMAT
  // ============================================

  /**
   * Transform AniList GraphQL response to Prisma MediaItem format
   *
   * This method prepares data for Prisma's create/update operations.
   * It handles nested AnimeMetadata creation and ensures all fields
   * match the Prisma schema types.
   *
   * @param {Object} anilistData - Raw data from AniList GraphQL API
   * @param {number} anilistData.id - AniList media ID
   * @param {number} [anilistData.idMal] - MyAnimeList ID
   * @param {Object} anilistData.title - Title object with romaji, english, native
   * @param {string} [anilistData.status] - Media status (RELEASING, FINISHED, etc.)
   * @param {Object} [anilistData.coverImage] - Cover image URLs
   * @param {string} [anilistData.bannerImage] - Banner image URL
   * @param {number} [anilistData.averageScore] - Average score (0-100)
   * @param {string} [anilistData.description] - HTML description
   * @param {boolean} [anilistData.isAdult] - Adult content flag
   * @param {number} [anilistData.episodes] - Total episodes
   * @param {number} [anilistData.duration] - Episode duration in minutes
   * @param {string} [anilistData.season] - Season (WINTER, SPRING, SUMMER, FALL)
   * @param {number} [anilistData.seasonYear] - Year of the season
   * @param {Object} [anilistData.studios] - Studios object with nodes array
   * @param {string} [anilistData.source] - Source material
   * @param {Object} [anilistData.trailer] - Trailer object with id and site
   * @returns {Object} Data formatted for Prisma upsert operation
   *
   * @example
   * const anilistData = await anilistClient.fetchById(1);
   * const dbData = animeAdapter.fromAnilist(anilistData);
   * await prisma.mediaItem.upsert({
   *   where: { idAnilist: dbData.idAnilist },
   *   create: dbData,
   *   update: dbData
   * });
   */
  fromExternal(externalData) {
    if (!externalData || !externalData.id) {
      throw new Error('Invalid external data: missing required id field');
    }

    return {
      // ========== MediaItem Core Fields ==========
      idAnilist: externalData.id,
      idMal: externalData.idMal || null,
      lastSyncedAt: new Date(),

      // Title fields
      titleRomaji: externalData.title?.romaji || 'Unknown Title',
      titleEnglish: externalData.title?.english || null,
      titleNative: externalData.title?.native || null,

      // Media type and status
      type: 'ANIME',
      status: this._mapAnilistStatus(externalData.status),

      // Images
      coverImage: this._extractCoverImage(externalData.coverImage),
      bannerImage: externalData.bannerImage || null,

      // Scoring and metadata
      isAdult: externalData.isAdult || false,
      averageScore: this._normalizeScore(externalData.averageScore),
      description: this._cleanDescription(externalData.description),
      // ========== AnimeMetadata Nested Create ==========
      animeMetadata: {
        create: {
          episodeCount: externalData.episodes || null,
          durationMin: externalData.duration || null,
          season: externalData.season || null,
          seasonYear: externalData.seasonYear || null,
          studio: this._extractStudio(externalData.studios),
          source: externalData.source || null,
          trailerUrl: this._buildTrailerUrl(externalData.trailer),
        },
      },
    };
  }

  /**
   * Transform AniList lightweight data (for batch operations)
   *
   * Used when fetching multiple anime at once or when only
   * basic information is needed (e.g., for list displays).
   *
   * @param {Object} externalData - Lightweight external data
   * @returns {Object} Minimal data for Prisma operations
   */
  fromExternalLightweight(externalData) {
    if (!externalData || !externalData.id) {
      throw new Error('Invalid external data: missing required id field');
    }

    return {
      idAnilist: externalData.id,
      titleRomaji: externalData.title?.romaji || 'Unknown Title',
      type: 'ANIME',
      coverImage: this._extractCoverImage(externalData.coverImage),
      lastSyncedAt: new Date(),

      animeMetadata: {
        create: {
          episodeCount: externalData.episodes || null,
        },
      },
    };
  }

  // ============================================
  // DATABASE → API RESPONSE FORMAT
  // ============================================

  /**
   * Transform Prisma MediaItem model to API response format
   *
   * This method creates a clean, client-friendly response by:
   * - Flattening nested relations
   * - Renaming fields for consistency
   * - Formatting dates and scores
   * - Removing internal database fields
   *
   * @param {Object} animeModel - Prisma MediaItem with animeMetadata relation
   * @param {bigint} animeModel.id - Database ID
   * @param {number} animeModel.idAnilist - AniList ID
   * @param {number} [animeModel.idMal] - MyAnimeList ID
   * @param {string} animeModel.titleRomaji - Romaji title
   * @param {string} [animeModel.titleEnglish] - English title
   * @param {string} [animeModel.titleNative] - Native title
   * @param {string} animeModel.type - Media type
   * @param {string} animeModel.status - Media status
   * @param {string} [animeModel.coverImage] - Cover image URL
   * @param {string} [animeModel.bannerImage] - Banner image URL
   * @param {number} [animeModel.averageScore] - Average score
   * @param {string} [animeModel.description] - Description text
   * @param {boolean} animeModel.isAdult - Adult content flag
   * @param {Date} [animeModel.lastSyncedAt] - Last sync timestamp
   * @param {Object} [animeModel.animeMetadata] - Anime-specific metadata
   * @returns {Object|null} Formatted API response or null if input is null
   *
   * @example
   * const anime = await prisma.mediaItem.findUnique({
   *   where: { idAnilist: 1 },
   *   include: { animeMetadata: true }
   * });
   * const response = animeAdapter.toResponse(anime);
   * res.json({ success: true, data: response });
   */
  toResponse(animeModel) {
    if (!animeModel) {
      return null;
    }

    return {
      id: animeModel.idAnilist,
      malId: animeModel.idMal,

      title: {
        romaji: animeModel.titleRomaji,
        english: animeModel.titleEnglish,
        native: animeModel.titleNative,
      },

      coverImage: animeModel.coverImage,
      bannerImage: animeModel.bannerImage,

      type: animeModel.type,
      status: animeModel.status,
      isAdult: animeModel.isAdult,

      score: animeModel.averageScore,

      description: animeModel.description,

      episodes: animeModel.animeMetadata?.episodeCount,
      duration: animeModel.animeMetadata?.durationMin,
      season: animeModel.animeMetadata?.season,
      seasonYear: animeModel.animeMetadata?.seasonYear,
      studio: animeModel.animeMetadata?.studio,
      source: animeModel.animeMetadata?.source,
      trailerUrl: animeModel.animeMetadata?.trailerUrl,

      lastSyncedAt: this._formatDate(animeModel.lastSyncedAt),
    };
  }

  /**
   * Transform array of Prisma MediaItem models to API response format
   *
   * Efficiently maps multiple anime models using toResponse().
   * Filters out any null results.
   *
   * @param {Array<Object>} animeList - Array of Prisma MediaItem models
   * @returns {Array<Object>} Array of formatted API responses
   *
   * @example
   * const animeList = await prisma.mediaItem.findMany({
   *   where: { type: 'ANIME' },
   *   include: { animeMetadata: true }
   * });
   * const response = animeAdapter.toResponseList(animeList);
   */
  toResponseList(animeList) {
    if (!Array.isArray(animeList)) {
      return [];
    }

    return animeList.map((anime) => this.toResponse(anime)).filter((anime) => anime !== null);
  }

  /**
   * Transform for lightweight list responses (cards, previews)
   *
   * Returns minimal data for list views to reduce payload size.
   *
   * @param {Object} animeModel - Prisma MediaItem model
   * @returns {Object|null} Minimal response object
   */
  toResponseMinimal(animeModel) {
    if (!animeModel) {
      return null;
    }

    return {
      id: animeModel.idAnilist,
      title: {
        romaji: animeModel.titleRomaji,
        english: animeModel.titleEnglish,
      },
      coverImage: animeModel.coverImage,
      episodes: animeModel.animeMetadata?.episodeCount,
      score: animeModel.averageScore,
      status: animeModel.status,
    };
  }

  // ============================================
  // HELPER METHODS (PRIVATE)
  // ============================================

  /**
   * Normalize AniList score (0-100) to application scale (0-10)
   *
   * AniList uses a 0-100 scale, but we store as 0-10 for consistency
   * with other rating systems (MAL uses 1-10).
   *
   * @private
   * @param {number} anilistScore - Score from AniList (0-100)
   * @returns {number|null} Normalized score (0-10) or null
   */
  _normalizeScore(anilistScore) {
    if (anilistScore === null || anilistScore === undefined) {
      return null;
    }

    const score = parseFloat(anilistScore);

    if (isNaN(score) || score < 0 || score > 100) {
      return null;
    }

    return Math.round(score) / 10;
  }

  /**
   * Map AniList status enum to Prisma MediaStatus enum
   *
   * Ensures compatibility between AniList's status values
   * and our database schema.
   *
   * @private
   * @param {string} anilistStatus - Status from AniList API
   * @returns {string} Mapped status for Prisma enum
   */
  _mapAnilistStatus(anilistStatus) {
    const statusMap = {
      RELEASING: 'RELEASING',
      FINISHED: 'FINISHED',
      NOT_YET_RELEASED: 'NOT_YET_RELEASED',
      CANCELLED: 'CANCELLED',
    };

    return statusMap[anilistStatus] || 'NOT_YET_RELEASED';
  }

  /**
   * Extract cover image URL with fallback priority
   *
   * Priority: extraLarge > large > medium > null
   *
   * @private
   * @param {Object} coverImage - Cover image object from AniList
   * @returns {string|null} Best quality cover URL or null
   */
  _extractCoverImage(coverImage) {
    if (!coverImage) {
      return null;
    }

    return coverImage.extraLarge || coverImage.large || coverImage.medium || null;
  }

  /**
   * Extract primary studio name from studios object
   *
   * AniList returns studios as a nested object with nodes array.
   * We take the first studio as the primary one.
   *
   * @private
   * @param {Object} studios - Studios object from AniList
   * @param {Array} [studios.nodes] - Array of studio objects
   * @returns {string|null} Primary studio name or null
   */
  _extractStudio(studios) {
    if (!studios) {
      return null;
    }

    const studioList = studios.nodes || studios;

    if (Array.isArray(studioList) && studioList.length > 0) {
      return studioList[0]?.name || null;
    }

    return null;
  }

  /**
   * Build complete trailer URL from AniList trailer object
   *
   * Supports YouTube and Dailymotion.
   *
   * @private
   * @param {Object} trailer - Trailer object from AniList
   * @param {string} trailer.id - Video ID on the platform
   * @param {string} trailer.site - Platform name (youtube, dailymotion)
   * @returns {string|null} Complete trailer URL or null
   */
  _buildTrailerUrl(trailer) {
    if (!trailer || !trailer.id) {
      return null;
    }

    const siteLower = trailer.site?.toLowerCase();

    const siteMap = {
      youtube: `https://www.youtube.com/watch?v=${trailer.id}`,
      dailymotion: `https://www.dailymotion.com/video/${trailer.id}`,
    };

    return siteMap[siteLower] || null;
  }

  /**
   * Clean HTML tags from description text
   *
   * AniList returns descriptions with HTML formatting.
   * This method:
   * - Converts <br> tags to newlines
   * - Strips all other HTML tags
   * - Trims whitespace
   *
   * @private
   * @param {string} description - HTML description from AniList
   * @returns {string|null} Cleaned plain text or null
   */
  _cleanDescription(description) {
    if (!description) {
      return null;
    }

    return description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /**
   * Format Date object to ISO 8601 string
   *
   * @private
   * @param {Date} date - Date object
   * @returns {string|null} ISO 8601 formatted date string or null
   */
  _formatDate(date) {
    if (!date) {
      return null;
    }

    return date.toISOString();
  }
}

module.exports = AnimeAdapter;
