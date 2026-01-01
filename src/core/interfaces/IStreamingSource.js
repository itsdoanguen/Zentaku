/**
 * Streaming Source Interface
 * 
 * @interface IStreamingSource
 * @description
 * Defines the contract for anime STREAMING/EPISODE sources.
 * Implementations: Consumet
 * 
 * Responsibilities:
 * - Get available episodes list
 * - Get streaming links (m3u8, mp4) for each episode
 * - Get video quality information (360p, 720p, 1080p)
 * - Get subtitles/captions if available
 * - Search anime in source for ID mapping
 * 
 * @example
 * class ConsumetClient extends IStreamingSource {
 *   async getEpisodes(animeId) { ... }
 *   async getStreamingLinks(episodeId) { ... }
 * }
 */
class IStreamingSource {
    constructor() {
        if (new.target === IStreamingSource) {
            throw new TypeError("Cannot construct IStreamingSource instances directly");
        }
    }

    // ==================== SEARCH & MAPPING ====================

    /**
     * Search anime in streaming source to get ID mapping
     * (Since AniList ID differs from Consumet ID, need to search for mapping)
     * 
     * @param {string} query - Anime title to search
     * @param {object} options - Search options
     * @returns {Promise<object[]>} - Result list [{ id, title, ... }]
     * @abstract
     * 
     * @example
     * const results = await consumet.searchAnime('Naruto');
     * // [{ id: 'naruto-123', title: 'Naruto', ... }]
     */
    async searchAnime(query, options = {}) {
        throw new Error('Method searchAnime() must be implemented');
    }

    /**
     * Get basic anime information in streaming source
     * @param {string} animeId - Anime ID in this source
     * @returns {Promise<object>} - { id, title, totalEpisodes, ... }
     * @abstract
     */
    async getAnimeInfo(animeId) {
        throw new Error('Method getAnimeInfo() must be implemented');
    }

    // ==================== EPISODES ====================

    /**
     * Get list of all available episodes
     * @param {string} animeId - Anime ID in source
     * @returns {Promise<object[]>} - Episodes list
     * @abstract
     * 
     * @example
     * const episodes = await consumet.getEpisodes('naruto-123');
     * // [
     * //   { id: 'ep-1', number: 1, title: 'Enter Naruto' },
     * //   { id: 'ep-2', number: 2, title: 'My Name is Konohamaru' }
     * // ]
     */
    async getEpisodes(animeId) {
        throw new Error('Method getEpisodes() must be implemented');
    }

    /**
     * Get detailed information for a specific episode
     * @param {string} episodeId - Episode ID
     * @returns {Promise<object>} - Episode info { id, number, title, ... }
     * @abstract
     */
    async getEpisodeInfo(episodeId) {
        throw new Error('Method getEpisodeInfo() must be implemented');
    }

    // ==================== STREAMING LINKS ====================

    /**
     * Get streaming links for an episode (m3u8, mp4, etc.)
     * THIS IS THE CORE FEATURE of IStreamingSource!
     * 
     * @param {string} episodeId - Episode ID
     * @param {object} options - Options { server, quality }
     * @returns {Promise<object>} - Streaming links and metadata
     * @abstract
     * 
     * @example
     * const links = await consumet.getStreamingLinks('naruto-ep-1');
     * // {
     * //   sources: [
     * //     { url: 'https://.../master.m3u8', quality: 'auto', isM3U8: true },
     * //     { url: 'https://.../720p.mp4', quality: '720p', isM3U8: false }
     * //   ],
     * //   subtitles: [
     * //     { url: 'https://.../en.vtt', lang: 'English' }
     * //   ],
     * //   headers: { Referer: 'https://...' }
     * // }
     */
    async getStreamingLinks(episodeId, options = {}) {
        throw new Error('Method getStreamingLinks() must be implemented');
    }

    /**
     * Get list of available servers for episode
     * @param {string} episodeId - Episode ID
     * @returns {Promise<string[]>} - Server names list
     * @abstract
     * 
     * @example
     * const servers = await consumet.getServers('ep-1');
     * // ['vidstreaming', 'gogo', 'streamsb']
     */
    async getServers(episodeId) {
        throw new Error('Method getServers() must be implemented');
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get the name of streaming source
     * @returns {string} - 'Consumet', 'Gogoanime', 'Zoro'
     * @abstract
     */
    getSourceName() {
        throw new Error('Method getSourceName() must be implemented');
    }

    /**
     * Check if source supports anime ID mapping from external source
     * (e.g., supports mapping from AniList ID to Consumet ID)
     * 
     * @param {string} externalSource - 'anilist', 'mal'
     * @returns {boolean}
     */
    supportsExternalMapping(externalSource) {
        return false; // Default: không hỗ trợ
    }

    /**
     * Map from external ID (AniList/MAL) to this source's ID
     * @param {number} externalId - ID from AniList/MAL
     * @param {string} externalSource - 'anilist' or 'mal'
     * @returns {Promise<string|null>} - ID in this source, or null if not found
     * @abstract
     */
    async mapExternalId(externalId, externalSource = 'anilist') {
        throw new Error('Method mapExternalId() must be implemented');
    }

    /**
     * Get rate limit information
     * @returns {object|null}
     */
    getRateLimitInfo() {
        return null;
    }
}

module.exports = IStreamingSource;
