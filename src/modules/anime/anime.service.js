const BaseMediaService = require('../../core/base/BaseMediaService');

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
    /**
     * Constructor with dependency injection
     * @param {Object} animeRepository - Anime database repository
     * @param {Object} animeAdapter - Anime data adapter
     * @param {Object} anilistAnimeClient - AniList API client
     */
    constructor(animeRepository, animeAdapter, anilistAnimeClient) {
        super(animeRepository, anilistAnimeClient, animeAdapter);
    }
    
    // ==================== ABSTRACT METHOD IMPLEMENTATIONS ====================
    
    /**
     * Get media type identifier
     * @returns {string} ANIME
     * @override
     */
    getMediaType() {
        return 'ANIME';
    }
    
    /**
     * Get external ID field name
     * @returns {string} idAnilist
     * @override
     */
    getExternalIdField() {
        return 'idAnilist';
    }
    
    // ==================== PUBLIC API ====================
    
    /**
     * Get anime details by Anilist ID.
     * Delegates to base class getDetails() template method
     * 
     * @param {number} anilistId - The Anilist ID of the anime
     * @returns {Promise<Object>} Formatted anime details
     * @throws {NotFoundError} If anime not found
     * @throws {ValidationError} If ID invalid
     */
    async getAnimeDetails(anilistId) {
        return this.getDetails(anilistId);
    }
}

module.exports = AnimeService;