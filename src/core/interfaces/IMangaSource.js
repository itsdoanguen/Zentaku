/**
 * Manga Source Interface
 * 
 * @interface IMangaSource
 * @description
 * Defines the contract for manga CHAPTER/PAGE sources.
 * Implementations: MangaDex
 * 
 * Responsibilities:
 * - Get available chapters list
 * - Get page image links for each chapter
 * - Get scanlation groups information
 * - Get chapter language information
 * - Search manga in source for ID mapping
 * 
 * @example
 * class MangaDexClient extends IMangaSource {
 *   async getChapters(mangaId) { ... }
 *   async getChapterPages(chapterId) { ... }
 * }
 */
class IMangaSource {
    constructor() {
        if (new.target === IMangaSource) {
            throw new TypeError("Cannot construct IMangaSource instances directly");
        }
    }

    // ==================== SEARCH & MAPPING ====================

    /**
     * Search manga in source to get ID mapping
     * (Since AniList ID differs from MangaDex ID, need to search for mapping)
     * 
     * @param {string} query - Manga title to search
     * @param {object} options - Search options
     * @returns {Promise<object[]>} - Result list
     * @abstract
     * 
     * @example
     * const results = await mangadex.searchManga('One Piece');
     * // [{ id: 'uuid-123', title: 'One Piece', ... }]
     */
    async searchManga(query, options = {}) {
        throw new Error('Method searchManga() must be implemented');
    }

    /**
     * Get basic manga information in source
     * @param {string} mangaId - Manga ID in this source
     * @returns {Promise<object>} - { id, title, totalChapters, ... }
     * @abstract
     */
    async getMangaInfo(mangaId) {
        throw new Error('Method getMangaInfo() must be implemented');
    }

    // ==================== CHAPTERS ====================

    /**
     * Get list of all available chapters
     * @param {string} mangaId - Manga ID in source
     * @param {object} options - Options { language, offset, limit }
     * @returns {Promise<object[]>} - Chapters list
     * @abstract
     * 
     * @example
     * const chapters = await mangadex.getChapters('one-piece-uuid');
     * // [
     * //   { 
     * //     id: 'chapter-1-uuid', 
     * //     number: '1', 
     * //     title: 'Romance Dawn',
     * //     language: 'en',
     * //     pages: 54,
     * //     scanlationGroup: 'Group Name'
     * //   }
     * // ]
     */
    async getChapters(mangaId, options = {}) {
        throw new Error('Method getChapters() must be implemented');
    }

    /**
     * Get detailed information for a specific chapter
     * @param {string} chapterId - Chapter ID
     * @returns {Promise<object>} - Chapter information
     * @abstract
     */
    async getChapterInfo(chapterId) {
        throw new Error('Method getChapterInfo() must be implemented');
    }

    // ==================== PAGES/IMAGES ====================

    /**
     * Get page image links for a chapter
     * THIS IS THE CORE FEATURE of IMangaSource!
     * 
     * @param {string} chapterId - Chapter ID
     * @param {object} options - Options { quality: 'data' | 'dataSaver' }
     * @returns {Promise<object>} - Links and metadata
     * @abstract
     * 
     * @example
     * const pages = await mangadex.getChapterPages('chapter-1-uuid');
     * // {
     * //   pages: [
     * //     { page: 1, url: 'https://.../page1.jpg' },
     * //     { page: 2, url: 'https://.../page2.jpg' }
     * //   ],
     * //   totalPages: 54,
     * //   headers: { Referer: 'https://...' }
     * // }
     */
    async getChapterPages(chapterId, options = {}) {
        throw new Error('Method getChapterPages() must be implemented');
    }

    /**
     * Get chapter download link (zip/cbz) if available
     * @param {string} chapterId - Chapter ID
     * @returns {Promise<string|null>} - Download URL or null
     * @abstract
     */
    async getChapterDownloadLink(chapterId) {
        // Optional - can return null if source doesn't support
        return null;
    }

    // ==================== SCANLATION GROUPS ====================

    /**
     * Get list of scanlation groups that uploaded chapters for manga
     * @param {string} mangaId - Manga ID
     * @returns {Promise<object[]>} - Groups list
     * @abstract
     */
    async getScanlationGroups(mangaId) {
        throw new Error('Method getScanlationGroups() must be implemented');
    }

    /**
     * Get chapters from a specific scanlation group
     * @param {string} mangaId - Manga ID
     * @param {string} groupId - Scanlation group ID
     * @returns {Promise<object[]>} - Chapters list
     * @abstract
     */
    async getChaptersByGroup(mangaId, groupId) {
        throw new Error('Method getChaptersByGroup() must be implemented');
    }

    // ==================== LANGUAGES ====================

    /**
     * Get available language list for manga
     * @param {string} mangaId - Manga ID
     * @returns {Promise<string[]>} - Language codes array ['en', 'ja', 'vi']
     * @abstract
     */
    async getAvailableLanguages(mangaId) {
        throw new Error('Method getAvailableLanguages() must be implemented');
    }

    /**
     * Get chapters for a specific language
     * @param {string} mangaId - Manga ID
     * @param {string} language - Language code ('en', 'ja', 'vi')
     * @returns {Promise<object[]>} - Chapters list
     * @abstract
     */
    async getChaptersByLanguage(mangaId, language) {
        throw new Error('Method getChaptersByLanguage() must be implemented');
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Get the name of manga source
     * @returns {string} - 'MangaDex', 'MangaSee', 'MangaKakalot'
     * @abstract
     */
    getSourceName() {
        throw new Error('Method getSourceName() must be implemented');
    }

    /**
     * Check if source supports manga ID mapping from external source
     * @param {string} externalSource - 'anilist', 'mal', 'mu'
     * @returns {boolean}
     */
    supportsExternalMapping(externalSource) {
        return false;
    }

    /**
     * Map from external ID (AniList/MAL) to this source's ID
     * @param {number} externalId - ID from AniList/MAL
     * @param {string} externalSource - 'anilist' or 'mal'
     * @returns {Promise<string|null>} - ID in this source
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

module.exports = IMangaSource;
