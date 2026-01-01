/**
 * Metadata Source Interface
 * 
 * @interface IMetadataSource
 * @description
 * Defines the contract for anime/manga METADATA information sources.
 * Implementations: AniList
 * 
 * Responsibilities:
 * - Detailed anime/manga information (title, description, cover, banner, rating)
 * - Search and filter by multiple criteria
 * - Character and staff information
 * - Statistics and rankings
 * - Seasonal anime listings
 * 
 * @example
 * class AnilistClient extends IMetadataSource {
 *   async getMediaInfo(mediaId, mediaType) { ... }
 *   async searchMedia(query, options) { ... }
 * }
 */
class IMetadataSource {
    constructor() {
        if (new.target === IMetadataSource) {
            throw new TypeError("Cannot construct IMetadataSource instances directly");
        }
    }

    // ==================== CORE METADATA METHODS ====================

    /**
     * Get detailed media information (anime/manga)
     * @param {number} mediaId - Media ID in the source
     * @param {string} mediaType - Media type ('ANIME', 'MANGA')
     * @returns {Promise<object>} - Complete media information
     * @throws {NotFoundError} - If media not found
     * @abstract
     */
    async getMediaInfo(mediaId, mediaType = 'ANIME') {
        throw new Error('Method getMediaInfo() must be implemented');
    }

    /**
     * Get basic media information (optimized for lists/cards)
     * @param {number} mediaId - Media ID
     * @param {string} mediaType - Media type
     * @returns {Promise<object>} - Basic information (id, title, cover)
     * @abstract
     */
    async getMediaBasicInfo(mediaId, mediaType = 'ANIME') {
        throw new Error('Method getMediaBasicInfo() must be implemented');
    }

    /**
     * Get multiple media items at once (batch)
     * @param {number[]} mediaIds - Array of media IDs
     * @param {string} mediaType - Media type
     * @returns {Promise<object>} - Map { mediaId: mediaData }
     * @abstract
     */
    async getMediaBatch(mediaIds, mediaType = 'ANIME') {
        throw new Error('Method getMediaBatch() must be implemented');
    }

    // ==================== SEARCH & DISCOVERY ====================

    /**
     * Search media by keyword
     * @param {string} query - Search query string
     * @param {object} options - Options { mediaType, page, perPage }
     * @returns {Promise<object>} - { pageInfo, media: [...] }
     * @abstract
     */
    async searchMedia(query, options = {}) {
        throw new Error('Method searchMedia() must be implemented');
    }

    /**
     * Advanced search by multiple criteria
     * @param {object} criteria - { genres, season, year, format, status }
     * @param {object} options - { page, perPage, sort }
     * @returns {Promise<object>} - Paginated search results
     * @abstract
     */
    async searchByCriteria(criteria = {}, options = {}) {
        throw new Error('Method searchByCriteria() must be implemented');
    }

    /**
     * Get seasonal anime list
     * @param {string} season - WINTER, SPRING, SUMMER, FALL
     * @param {number} year - Year
     * @param {object} options - Pagination & sort options
     * @returns {Promise<object>} - Seasonal anime list
     * @abstract
     */
    async getSeasonalAnime(season, year, options = {}) {
        throw new Error('Method getSeasonalAnime() must be implemented');
    }

    // ==================== CHARACTERS & STAFF ====================

    /**
     * Get character list for media
     * @param {number} mediaId - Media ID
     * @param {object} options - Pagination options
     * @returns {Promise<object>} - { pageInfo, characters: [...] }
     * @abstract
     */
    async getCharacters(mediaId, options = {}) {
        throw new Error('Method getCharacters() must be implemented');
    }

    /**
     * Get staff list for media
     * @param {number} mediaId - Media ID
     * @param {object} options - Pagination options
     * @returns {Promise<object>} - { pageInfo, staff: [...] }
     * @abstract
     */
    async getStaff(mediaId, options = {}) {
        throw new Error('Method getStaff() must be implemented');
    }

    /**
     * Get detailed character information
     * @param {number} characterId - Character ID
     * @returns {Promise<object>} - Character information
     * @abstract
     */
    async getCharacterInfo(characterId) {
        throw new Error('Method getCharacterInfo() must be implemented');
    }

    /**
     * Get detailed staff information
     * @param {number} staffId - Staff ID
     * @returns {Promise<object>} - Staff information
     * @abstract
     */
    async getStaffInfo(staffId) {
        throw new Error('Method getStaffInfo() must be implemented');
    }

    // ==================== STATISTICS & RANKINGS ====================

    /**
     * Get media statistics and rankings
     * @param {number} mediaId - Media ID
     * @returns {Promise<object>} - Statistics data
     * @abstract
     */
    async getStatistics(mediaId) {
        throw new Error('Method getStatistics() must be implemented');
    }

    /**
     * Get cover images for multiple media items
     * @param {number[]} mediaIds - Array of media IDs
     * @returns {Promise<object>} - Map { mediaId: coverUrl }
     * @abstract
     */
    async getCoversBatch(mediaIds) {
        throw new Error('Method getCoversBatch() must be implemented');
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get the name of this metadata source
     * @returns {string} - 'AniList', 'MyAnimeList', etc.
     * @abstract
     */
    getSourceName() {
        throw new Error('Method getSourceName() must be implemented');
    }

    /**
     * Check if media type is supported
     * @param {string} mediaType - 'ANIME', 'MANGA', 'NOVEL'
     * @returns {boolean}
     */
    supportsMediaType(mediaType) {
        return ['ANIME', 'MANGA'].includes(mediaType);
    }

    /**
     * Get rate limit information
     * @returns {object|null} - { limit, remaining, resetAt } or null
     */
    getRateLimitInfo() {
        return null;
    }
}

module.exports = IMetadataSource;
