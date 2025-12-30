const httpClient = require('../../services/httpClient');
const logger = require('../../utils/logger');
const { AnilistAPIError, NotFoundError } = require('../../utils/errors');

const {
    ANIME_INFO_QS,
    ANIME_INFO_LIGHTWEIGHT_QS,
    ANIME_COVERS_BATCH_QS,
    ANIME_ID_SEARCH_QS,
    ANIME_SEASON_TREND_QS,
    ANIME_SEARCH_CRITERIA_QS,
    ANIME_CHARACTERS_QS,
    ANIME_STAFF_QS,
    ANIME_STATS_QS,
    ANIME_WHERE_TO_WATCH_QS,
    ANIME_BATCH_INFO_QS,
    CHARACTER_INFO_QS,
    STAFF_INFO_QS
} = require('./anilist.query');

/**
 * Repository for interacting with the Anilist API.
 */
class AnilistRepository {
    constructor() {
        this.apiUrl = 'https://graphql.anilist.co';
    }

    /**
     * Execute a GraphQL query against the Anilist API.
     * @param {string} query - The GraphQL query string.
     * @param {object} variables - The variables for the GraphQL query.
     * @returns {Promise<object>} - The response data from the API.
     * @throws {AnilistAPIError} - If the API request fails.
     * 
     * @private
     */
    async _executeQuery(query, variables = {}, operationName = "AnilistQuery") {
        const startTime = Date.now();

        try {
            const response = await httpClient.post(this.apiUrl, {
                query,
                variables,
                operationName
            });

            const duration = Date.now() - startTime;
            logger.info(`[API] ${operationName} executed in ${duration}ms`);

            if (response.data.errors) {
                logger.error(`[API] ${JSON.stringify(response.data.errors)}`);
                throw new AnilistAPIError(
                    'Anilist API returned errors',
                    response.status,
                    response.data.errors
                );
            }

            return response.data.data;
        } catch (error) {
            const duration = Date.now() - startTime;

            if (error instanceof AnilistAPIError) {
                throw error;
            }

            if (error.response) {
                logger.error(`[API] ${operationName} failed with status ${error.response.status} in ${duration}ms`);
                throw new AnilistAPIError(
                    `Anilist API request failed with status ${error.response.status}`,
                    error.response.status,
                    error.response.data
                );
            } else {
                logger.error(`[API] ${operationName} request error: ${error.message} in ${duration}ms`);
                throw new AnilistAPIError(
                    error.response.data?.message || `Anilist API request error: ${error.message}`,
                    error.response?.status || 500,
                    error.response?.data || {}
                );
            }

            logger.error(`[API] ${operationName} FAILED after ${duration}ms:`, error.message);
            throw new AnilistAPIError(
                `Network error: ${error.message}`,
                500,
                null
            );
        }
    }

    /**
     * Fetch detailed anime information by its ID.
     * @param {number} animeId - The ID of the anime.
     * @returns {Promise<object>} - The anime information.
     * @throws {AnilistAPIError} - If the API request fails.
     * @throws {NotFoundError} - If the anime is not found.
     */
    async featchAnimeInfoById(animeId) {
        const data = await this._executeQuery(ANIME_INFO_QS, { id: animeId }, `FetchAnimeInfoById(${animeId})`);

        if (!data || !data.Media) {
            throw new NotFoundError(`Anime with ID ${animeId} not found`);
        }
        return data.Media;
    }
    /**
     * Fetch lightweight anime information (for lists)
     * @param {number} animeId - The ID of the anime.
     * @returns {Promise<object>} - The lightweight anime information.
     * @throws {AnilistAPIError} - If the API request fails.
     * @throws {NotFoundError} - If the anime is not found.
     */
    async fetchAnimeBasicInfo(animeId) {
        const data = await this._executeQuery(
            ANIME_INFO_LIGHTWEIGHT_QS,
            { id: animeId },
            `fetchAnimeBasicInfo(${animeId})`
        );

        if (!data.Media) {
            throw new NotFoundError('Anime', animeId);
        }

        return data.Media;
    }

    /**
     * Fetch multiple anime in batch (max 50)
     * @param {number[]} animeIds - Array of anime IDs.
     * @returns {Promise<object>} - Map of animeId to anime data.
     * @throws {AnilistAPIError} - If the API request fails.
     */
    async fetchAnimeBatch(animeIds) {
        if (!animeIds || animeIds.length === 0) {
            return {};
        }

        if (animeIds.length > 50) {
            logger.warn(`fetchAnimeBatch called with ${animeIds.length} IDs, limiting to 50`);
            animeIds = animeIds.slice(0, 50);
        }

        const data = await this._executeQuery(
            ANIME_BATCH_INFO_QS,
            { ids: animeIds },
            `fetchAnimeBatch(${animeIds.length} anime)`
        );

        // Convert array to map: { animeId: animeData }
        const result = {};
        const mediaList = data.Page?.media || [];

        mediaList.forEach((anime) => {
            if (anime?.id) {
                result[anime.id] = anime;
            }
        });

        logger.debug(`fetchAnimeBatch: requested ${animeIds.length}, received ${Object.keys(result).length}`);
        return result;
    }

    /**
     * Fetch characters for an anime
     * @param {number} animeId - The ID of the anime.
     * @param {object} options - Pagination options.
     * @param {string} options.language - Language preference for character names.
     */
    async fetchCharactersByAnimeId(animeId, options = {}) {
        const { language = 'JAPANESE', page = 1, perPage = 10 } = options;

        const data = await this._executeQuery(
            ANIME_CHARACTERS_QS,
            { id: animeId, page, perpage: perPage },
            `fetchCharacters(${animeId})`
        );

        const characters = data.Media?.characters || {};
        return {
            pageInfo: characters.pageInfo || {},
            edges: characters.edges || [],
        };
    }

    /**
     * Fetch staff for an anime
     * @param {number} animeId - The ID of the anime.
     * @param {object} options - Pagination options.
     * @param {number} options.page - Page number.
     * @param {number} options.perPage - Items per page.
     */
    async fetchStaffByAnimeId(animeId, options = {}) {
        const { page = 1, perPage = 10 } = options;

        const data = await this._executeQuery(
            ANIME_STAFF_QS,
            { id: animeId, page, perpage: perPage },
            `fetchStaff(${animeId})`
        );

        const staff = data.Media?.staff || {};
        return {
            pageInfo: staff.pageInfo || {},
            edges: staff.edges || [],
        };
    }

    /**
     * Fetch statistics and rankings
     * @param {number} animeId - The ID of the anime.
     * @returns {Promise<object>} - The anime statistics.
     * @throws {AnilistAPIError} - If the API request fails.
     */
    async fetchStatsByAnimeId(animeId) {
        const data = await this._executeQuery(
            ANIME_STATS_QS,
            { id: animeId },
            `fetchStats(${animeId})`
        );

        return data.Media;
    }

    /**
     * Fetch streaming platforms
     * @param {number} animeId - The ID of the anime.
     * @returns {Promise<object[]>} - The streaming platform information.
     * @throws {AnilistAPIError} - If the API request fails.
     */
    async fetchWhereToWatch(animeId) {
        const data = await this._executeQuery(
            ANIME_WHERE_TO_WATCH_QS,
            { id: animeId },
            `fetchWhereToWatch(${animeId})`
        );

        return data.Media?.streamingEpisodes || [];
    }

    /**
     * Fetch only cover images in batch
     * @param {number[]} animeIds - Array of anime IDs.
     * @returns {Promise<object>} - Map of animeId to cover image URL.
     * @throws {AnilistAPIError} - If the API request fails.
     */
    async fetchAnimeCoversBatch(animeIds) {
        if (!animeIds || animeIds.length === 0) {
            return {};
        }

        if (animeIds.length > 50) {
            logger.warn(`fetchAnimeCoversBatch called with ${animeIds.length} IDs, limiting to 50`);
            animeIds = animeIds.slice(0, 50);
        }

        const data = await this._executeQuery(
            ANIME_COVERS_BATCH_QS,
            { ids: animeIds },
            `fetchAnimeCoversBatch(${animeIds.length} covers)`
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
     * @param {string} query - Search query string.
     * @param {object} options - Pagination options.
     * @param {number} options.page - Page number (default: 1).
     * @param {number} options.perPage - Items per page (default: 20).
     * @returns {Promise<object>} - Search results with pageInfo and media list.
     * @throws {AnilistAPIError} - If the API request fails.
     */
    async searchAnime(query, options = {}) {
        const { page = 1, perPage = 20 } = options;

        const data = await this._executeQuery(
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
     * Fetch anime by season and year with optional sorting
     * @param {string} season - Season (WINTER, SPRING, SUMMER, FALL).
     * @param {number} seasonYear - Year of the season.
     * @param {object} options - Pagination and sorting options.
     * @param {number} options.page - Page number (default: 1).
     * @param {number} options.perPage - Items per page (default: 20).
     * @param {string[]} options.sort - Sort criteria (e.g., ['POPULARITY_DESC', 'SCORE_DESC']).
     * @returns {Promise<object>} - Seasonal anime list with pageInfo.
     * @throws {AnilistAPIError} - If the API request fails.
     */
    async fetchSeasonalAnime(season, seasonYear, options = {}) {
        const { page = 1, perPage = 20, sort = ['POPULARITY_DESC'] } = options;

        const data = await this._executeQuery(
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
     * @param {object} criteria - Search criteria.
     * @param {string[]} criteria.genres - Array of genre names.
     * @param {string} criteria.season - Season (WINTER, SPRING, SUMMER, FALL).
     * @param {number} criteria.seasonYear - Year of the season.
     * @param {string} criteria.format - Format (TV, TV_SHORT, MOVIE, SPECIAL, OVA, ONA, MUSIC).
     * @param {string} criteria.status - Status (RELEASING, FINISHED, NOT_YET_RELEASED, CANCELLED).
     * @param {object} options - Pagination and sorting options.
     * @param {number} options.page - Page number (default: 1).
     * @param {number} options.perPage - Items per page (default: 20).
     * @param {string[]} options.sort - Sort criteria.
     * @returns {Promise<object>} - Search results with pageInfo and media list.
     * @throws {AnilistAPIError} - If the API request fails.
     */
    async searchAnimeByCriteria(criteria = {}, options = {}) {
        const { genres, season, seasonYear, format, status } = criteria;
        const { page = 1, perPage = 20, sort = ['POPULARITY_DESC'] } = options;

        const data = await this._executeQuery(
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
     * Fetch detailed character information by ID
     * @param {number} characterId - The ID of the character.
     * @returns {Promise<object>} - The character information.
     * @throws {AnilistAPIError} - If the API request fails.
     * @throws {NotFoundError} - If the character is not found.
     */
    async fetchCharacterById(characterId) {
        const data = await this._executeQuery(
            CHARACTER_INFO_QS,
            { id: characterId },
            `fetchCharacterById(${characterId})`
        );

        if (!data.Character) {
            throw new NotFoundError('Character', characterId);
        }

        return data.Character;
    }

    /**
     * Fetch detailed staff information by ID
     * @param {number} staffId - The ID of the staff member.
     * @returns {Promise<object>} - The staff information.
     * @throws {AnilistAPIError} - If the API request fails.
     * @throws {NotFoundError} - If the staff member is not found.
     */
    async fetchStaffById(staffId) {
        const data = await this._executeQuery(
            STAFF_INFO_QS,
            { id: staffId },
            `fetchStaffById(${staffId})`
        );

        if (!data.Staff) {
            throw new NotFoundError('Staff', staffId);
        }

        return data.Staff;
    }
}

module.exports = new AnilistRepository();
