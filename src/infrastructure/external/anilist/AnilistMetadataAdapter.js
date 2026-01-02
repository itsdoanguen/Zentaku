const IMetadataSource = require('../../../core/interfaces/IMetadataSource');
const AnilistAnimeClient = require('./AnilistAnimeClient');

/**
 * AniList Metadata Adapter
 * Implements IMetadataSource interface using AnilistAnimeClient
 * 
 * @extends {IMetadataSource}
 */
class AnilistMetadataAdapter extends IMetadataSource {
    constructor() {
        super();
        this.animeClient = new AnilistAnimeClient();
    }

    // ==================== IMETADATASOURCE IMPLEMENTATION ====================

    /**
     * Get detailed media information
     * 
     * @override
     * @param {number} mediaId - Media ID
     * @param {string} mediaType - Media type (currently only 'ANIME' supported)
     * @returns {Promise<object>} - Media information
     * @throws {Error} - If unsupported media type
     */
    async getMediaInfo(mediaId, mediaType = 'ANIME') {
        if (mediaType !== 'ANIME') {
            throw new Error(`AniList adapter currently only supports ANIME media type, got: ${mediaType}`);
        }
        return this.animeClient.fetchById(mediaId);
    }

    /**
     * Get lightweight media information (for lists/cards)
     * 
     * @override
     * @param {number} mediaId - Media ID
     * @param {string} mediaType - Media type (currently only 'ANIME' supported)
     * @returns {Promise<object>} - Basic media information
     * @throws {Error} - If unsupported media type
     */
    async getMediaBasicInfo(mediaId, mediaType = 'ANIME') {
        if (mediaType !== 'ANIME') {
            throw new Error(`AniList adapter currently only supports ANIME media type, got: ${mediaType}`);
        }
        return this.animeClient.fetchLightweight(mediaId);
    }

    /**
     * Get multiple media items in batch
     * 
     * @override
     * @param {number[]} mediaIds - Array of media IDs
     * @param {string} mediaType - Media type (currently only 'ANIME' supported)
     * @returns {Promise<object>} - Map of mediaId => media data
     * @throws {Error} - If unsupported media type
     */
    async getMediaBatch(mediaIds, mediaType = 'ANIME') {
        if (mediaType !== 'ANIME') {
            throw new Error(`AniList adapter currently only supports ANIME media type, got: ${mediaType}`);
        }
        return this.animeClient.fetchBatch(mediaIds);
    }

    /**
     * Search media by keyword
     * 
     * @override
     * @param {string} query - Search query
     * @param {object} options - Search options
     * @param {string} options.mediaType - Media type (default: 'ANIME')
     * @param {number} options.page - Page number
     * @param {number} options.perPage - Items per page
     * @returns {Promise<object>} - Search results with pageInfo and media
     * @throws {Error} - If unsupported media type
     */
    async searchMedia(query, options = {}) {
        const { mediaType = 'ANIME', ...searchOptions } = options;
        
        if (mediaType !== 'ANIME') {
            throw new Error(`AniList adapter currently only supports ANIME media type, got: ${mediaType}`);
        }
        
        return this.animeClient.search(query, searchOptions);
    }

    /**
     * Advanced search by multiple criteria
     * 
     * @override
     * @param {object} criteria - Search criteria
     * @param {string} criteria.mediaType - Media type (default: 'ANIME')
     * @param {string[]} criteria.genres - Array of genre names
     * @param {string} criteria.season - Season
     * @param {number} criteria.seasonYear - Year
     * @param {string} criteria.format - Format
     * @param {string} criteria.status - Status
     * @param {object} options - Pagination and sorting options
     * @returns {Promise<object>} - Search results with pageInfo and media
     * @throws {Error} - If unsupported media type
     */
    async searchByCriteria(criteria = {}, options = {}) {
        const { mediaType = 'ANIME', ...otherCriteria } = criteria;
        
        if (mediaType !== 'ANIME') {
            throw new Error(`AniList adapter currently only supports ANIME media type, got: ${mediaType}`);
        }
        
        return this.animeClient.searchByCriteria(otherCriteria, options);
    }

    /**
     * Get seasonal anime list
     * 
     * @override
     * @param {string} season - Season (WINTER, SPRING, SUMMER, FALL)
     * @param {number} year - Year
     * @param {object} options - Pagination and sorting options
     * @returns {Promise<object>} - Seasonal anime with pageInfo
     */
    async getSeasonalAnime(season, year, options = {}) {
        return this.animeClient.fetchSeasonal(season, year, options);
    }

    /**
     * Get characters for a media
     * 
     * @override
     * @param {number} mediaId - Media ID
     * @param {object} options - Pagination options
     * @returns {Promise<object>} - Characters with pageInfo and edges
     */
    async getCharacters(mediaId, options = {}) {
        return this.animeClient.fetchCharacters(mediaId, options);
    }

    /**
     * Get staff for a media
     * 
     * @override
     * @param {number} mediaId - Media ID
     * @param {object} options - Pagination options
     * @returns {Promise<object>} - Staff with pageInfo and edges
     */
    async getStaff(mediaId, options = {}) {
        return this.animeClient.fetchStaff(mediaId, options);
    }

    /**
     * Get statistics for a media
     * 
     * @override
     * @param {number} mediaId - Media ID
     * @returns {Promise<object>} - Media statistics
     */
    async getStatistics(mediaId) {
        return this.animeClient.fetchStatistics(mediaId);
    }

    /**
     * Get detailed character information
     * 
     * @override
     * @param {number} characterId - Character ID
     * @returns {Promise<object>} - Character information
     */
    async getCharacterInfo(characterId) {
        return this.animeClient.fetchCharacterById(characterId);
    }

    /**
     * Get detailed staff information
     * 
     * @override
     * @param {number} staffId - Staff ID
     * @returns {Promise<object>} - Staff information
     */
    async getStaffInfo(staffId) {
        return this.animeClient.fetchStaffById(staffId);
    }

    /**
     * Get cover images in batch
     * 
     * @override
     * @param {number[]} mediaIds - Array of media IDs
     * @returns {Promise<object>} - Map of mediaId => cover URL
     */
    async getCoversBatch(mediaIds) {
        return this.animeClient.fetchCoversBatch(mediaIds);
    }

    /**
     * Get source name
     * 
     * @override
     * @returns {string} - 'AniList'
     */
    getSourceName() {
        return 'AniList';
    }

    /**
     * Check if media type is supported
     * 
     * @override
     * @param {string} mediaType - Media type to check
     * @returns {boolean} - True if supported
     */
    supportsMediaType(mediaType) {
        // Currently only ANIME is implemented
        // Future: Add MANGA and NOVEL support
        return mediaType === 'ANIME';
    }

    /**
     * Get rate limit information
     * 
     * @override
     * @returns {object|null} - Rate limit info
     */
    getRateLimitInfo() {
        return {
            limit: 60,
            window: 60000, 
        };
    }
}

module.exports = AnilistMetadataAdapter;
