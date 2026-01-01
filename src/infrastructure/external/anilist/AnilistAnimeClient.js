const AnilistClient = require('./AnilistClient');
const logger = require('../../../shared/utils/logger');
const { NotFoundError } = require('../../../shared/utils/error');
const {
    ANIME_INFO_QS,
    ANIME_INFO_LIGHTWEIGHT_QS,
    ANIME_BATCH_INFO_QS,
    ANIME_COVERS_BATCH_QS,
    ANIME_ID_SEARCH_QS,
    ANIME_SEASON_TREND_QS,
    ANIME_SEARCH_CRITERIA_QS,
    ANIME_CHARACTERS_QS,
    ANIME_STAFF_QS,
    ANIME_STATS_QS,
    ANIME_WHERE_TO_WATCH_QS,
    CHARACTER_INFO_QS,
    STAFF_INFO_QS
} = require('./anilist.queries');

/**
 * AniList Anime Client
 * Handles all anime-specific operations
 * 
 * @extends {AnilistClient}
 */
class AnilistAnimeClient extends AnilistClient {
    /**
     * Fetch detailed anime information by ID
     * 
     * @param {number} animeId - Anime ID
     * @returns {Promise<object>} - Anime data
     * @throws {NotFoundError} - If anime not found
     */
    async fetchById(animeId) {
        const data = await this.executeQuery(
            ANIME_INFO_QS,
            { id: animeId },
            `fetchAnimeById(${animeId})`
        );

        if (!data?.Media) {
            throw new NotFoundError(`Anime with ID ${animeId} not found`);
        }

        return data.Media;
    }

    /**
     * Fetch lightweight anime info (for lists/cards)
     * 
     * @param {number} animeId - Anime ID
     * @returns {Promise<object>} - Basic anime data
     * @throws {NotFoundError} - If anime not found
     */
    async fetchLightweight(animeId) {
        const data = await this.executeQuery(
            ANIME_INFO_LIGHTWEIGHT_QS,
            { id: animeId },
            `fetchAnimeLightweight(${animeId})`
        );

        if (!data?.Media) {
            throw new NotFoundError(`Anime with ID ${animeId} not found`);
        }

        return data.Media;
    }

    /**
     * Fetch multiple anime in batch (max 50)
     * 
     * @param {number[]} animeIds - Array of anime IDs
     * @returns {Promise<object>} - Map of animeId => anime data
     */
    async fetchBatch(animeIds) {
        if (!animeIds || animeIds.length === 0) {
            return {};
        }

        if (animeIds.length > 50) {
            logger.warn(`fetchBatch called with ${animeIds.length} IDs, limiting to 50`);
            animeIds = animeIds.slice(0, 50);
        }

        const data = await this.executeQuery(
            ANIME_BATCH_INFO_QS,
            { ids: animeIds },
            `fetchAnimeBatch(${animeIds.length})`
        );

        const result = {};
        const mediaList = data.Page?.media || [];

        mediaList.forEach((anime) => {
            if (anime?.id) {
                result[anime.id] = anime;
            }
        });

        logger.debug(`fetchBatch: requested ${animeIds.length}, received ${Object.keys(result).length}`);
        return result;
    }

    /**
     * Fetch cover images in batch
     * 
     * @param {number[]} animeIds - Array of anime IDs
     * @returns {Promise<object>} - Map of animeId => cover URL
     */
    async fetchCoversBatch(animeIds) {
        if (!animeIds || animeIds.length === 0) {
            return {};
        }

        if (animeIds.length > 50) {
            logger.warn(`fetchCoversBatch called with ${animeIds.length} IDs, limiting to 50`);
            animeIds = animeIds.slice(0, 50);
        }

        const data = await this.executeQuery(
            ANIME_COVERS_BATCH_QS,
            { ids: animeIds },
            `fetchAnimeCoversBatch(${animeIds.length})`
        );

        const result = {};
        const mediaList = data.Page?.media || [];

        mediaList.forEach((anime) => {
            if (anime?.id) {
                result[anime.id] = anime.coverImage?.large || null;
            }
        });

        return result;
    }

    /**
     * Search anime by query string
     * 
     * @param {string} query - Search query
     * @param {object} options - Pagination options
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.perPage - Items per page (default: 20)
     * @returns {Promise<object>} - Search results with pageInfo and media
     */
    async search(query, options = {}) {
        const { page = 1, perPage = 20 } = options;

        const data = await this.executeQuery(
            ANIME_ID_SEARCH_QS,
            { query, page, perpage: perPage },
            `searchAnime("${query}")`
        );

        return {
            pageInfo: data.Page?.pageInfo || {},
            media: data.Page?.media || [],
        };
    }

    /**
     * Fetch seasonal anime
     * 
     * @param {string} season - Season (WINTER, SPRING, SUMMER, FALL)
     * @param {number} seasonYear - Year
     * @param {object} options - Pagination and sorting options
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.perPage - Items per page (default: 20)
     * @param {string[]} options.sort - Sort criteria (default: ['POPULARITY_DESC'])
     * @returns {Promise<object>} - Seasonal anime with pageInfo
     */
    async fetchSeasonal(season, seasonYear, options = {}) {
        const { page = 1, perPage = 20, sort = ['POPULARITY_DESC'] } = options;

        const data = await this.executeQuery(
            ANIME_SEASON_TREND_QS,
            { season, seasonYear, page, perpage: perPage, sort },
            `fetchSeasonalAnime(${season} ${seasonYear})`
        );

        return {
            pageInfo: data.Page?.pageInfo || {},
            media: data.Page?.media || [],
        };
    }

    /**
     * Search anime by multiple criteria
     * 
     * @param {object} criteria - Search criteria
     * @param {string[]} criteria.genres - Array of genre names
     * @param {string} criteria.season - Season (WINTER, SPRING, SUMMER, FALL)
     * @param {number} criteria.seasonYear - Year of the season
     * @param {string} criteria.format - Format (TV, TV_SHORT, MOVIE, SPECIAL, OVA, ONA, MUSIC)
     * @param {string} criteria.status - Status (RELEASING, FINISHED, NOT_YET_RELEASED, CANCELLED)
     * @param {object} options - Pagination and sorting options
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.perPage - Items per page (default: 20)
     * @param {string[]} options.sort - Sort criteria (default: ['POPULARITY_DESC'])
     * @returns {Promise<object>} - Search results with pageInfo and media
     */
    async searchByCriteria(criteria = {}, options = {}) {
        const { genres, season, seasonYear, format, status } = criteria;
        const { page = 1, perPage = 20, sort = ['POPULARITY_DESC'] } = options;

        const data = await this.executeQuery(
            ANIME_SEARCH_CRITERIA_QS,
            { genres, season, seasonYear, format, status, page, perpage: perPage, sort },
            `searchAnimeByCriteria()`
        );

        return {
            pageInfo: data.Page?.pageInfo || {},
            media: data.Page?.media || [],
        };
    }

    /**
     * Fetch characters for an anime
     * 
     * @param {number} animeId - Anime ID
     * @param {object} options - Pagination options
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.perPage - Items per page (default: 10)
     * @returns {Promise<object>} - Characters with pageInfo and edges
     */
    async fetchCharacters(animeId, options = {}) {
        const { page = 1, perPage = 10 } = options;

        const data = await this.executeQuery(
            ANIME_CHARACTERS_QS,
            { id: animeId, page, perpage: perPage },
            `fetchAnimeCharacters(${animeId})`
        );

        return {
            pageInfo: data.Media?.characters?.pageInfo || {},
            edges: data.Media?.characters?.edges || [],
        };
    }

    /**
     * Fetch staff for an anime
     * 
     * @param {number} animeId - Anime ID
     * @param {object} options - Pagination options
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.perPage - Items per page (default: 10)
     * @returns {Promise<object>} - Staff with pageInfo and edges
     */
    async fetchStaff(animeId, options = {}) {
        const { page = 1, perPage = 10 } = options;

        const data = await this.executeQuery(
            ANIME_STAFF_QS,
            { id: animeId, page, perpage: perPage },
            `fetchAnimeStaff(${animeId})`
        );

        return {
            pageInfo: data.Media?.staff?.pageInfo || {},
            edges: data.Media?.staff?.edges || [],
        };
    }

    /**
     * Fetch statistics for an anime
     * 
     * @param {number} animeId - Anime ID
     * @returns {Promise<object>} - Anime statistics
     */
    async fetchStatistics(animeId) {
        const data = await this.executeQuery(
            ANIME_STATS_QS,
            { id: animeId },
            `fetchAnimeStats(${animeId})`
        );

        return data.Media;
    }

    /**
     * Fetch streaming platforms information
     * 
     * @param {number} animeId - Anime ID
     * @returns {Promise<object[]>} - Streaming platform information
     */
    async fetchWhereToWatch(animeId) {
        const data = await this.executeQuery(
            ANIME_WHERE_TO_WATCH_QS,
            { id: animeId },
            `fetchWhereToWatch(${animeId})`
        );

        return data.Media?.streamingEpisodes || [];
    }

    /**
     * Fetch detailed character information by ID
     * 
     * @param {number} characterId - Character ID
     * @returns {Promise<object>} - Character information
     * @throws {NotFoundError} - If character not found
     */
    async fetchCharacterById(characterId) {
        const data = await this.executeQuery(
            CHARACTER_INFO_QS,
            { id: characterId },
            `fetchCharacterById(${characterId})`
        );

        if (!data?.Character) {
            throw new NotFoundError(`Character with ID ${characterId} not found`);
        }

        return data.Character;
    }

    /**
     * Fetch detailed staff information by ID
     * 
     * @param {number} staffId - Staff ID
     * @returns {Promise<object>} - Staff information
     * @throws {NotFoundError} - If staff not found
     */
    async fetchStaffById(staffId) {
        const data = await this.executeQuery(
            STAFF_INFO_QS,
            { id: staffId },
            `fetchStaffById(${staffId})`
        );

        if (!data?.Staff) {
            throw new NotFoundError(`Staff with ID ${staffId} not found`);
        }

        return data.Staff;
    }
}

module.exports = AnilistAnimeClient;
