const animeRepository = require('./anime.repository');
const anilistRepository = require('../../infrastructure/external/anilist/AnilistClient');
const { NotFoundError, AnilistAPIError } = require('../../shared/utils/error');
const logger = require('../../shared/utils/logger');
class AnimeService {
    /**
     * Get anime details by Anilist ID.
     * @param {number} anilistId - The Anilist ID of the anime.
     * @return {Promise<Object>} - The anime details.
     * @throws {NotFoundError} - If the anime is not found.
     * @throws {AnilistAPIError} - If there is an error fetching from Anilist or API returns an error.
     */
    async getAnimeDetails(anilistId) {
        try {
            let anime = await animeRepository.findAnimeById(anilistId);

            if (this._shouldSyncFromAnilist(anime)) {
                logger.info(`Syncing anime ID ${anilistId} from Anilist.`);
                try {
                    const anilistData = await anilistRepository.featchAnimeInfoById(anilistId);
                    if (!anilistData) {
                        throw new NotFoundError(`Anime with ID ${anilistId} not found on Anilist.`);
                    }
                    const transformedData = this._transformAnilistData(anilistData);
                    anime = await animeRepository.upsertAnime(transformedData);
                } catch (error) {
                    if (anime) {
                        logger.warn(`Failed to sync anime ID ${anilistId} from Anilist, using cached data. Error: ${error.message}`);
                    }
                    if (error instanceof NotFoundError) {
                        throw error;
                    }
                    throw new AnilistAPIError(`Failed to fetch anime from Anilist: ${error.message}`);
                }
            }

            if (!anime) {
                throw new NotFoundError(`Anime with ID ${anilistId} not found.`);
            }
            return this._formatAnimeResponse(anime);
        } catch (error) {
            logger.error(`Error in getAnimeDetails for ID ${anilistId}: ${error.message}`);
            if (error instanceof NotFoundError || error instanceof AnilistAPIError) {
                throw error;
            }
            throw new AnilistAPIError(`Anilist API error: ${error.message}`);
        }
    }

    
    //PRIVATE METHODS


    /**
     * Check if we should sync anime data from Anilist.
     * @param {Object} anime - The anime data from the database.
     * @return {boolean} - True if we should sync, false otherwise.
     * @private
     */
    _shouldSyncFromAnilist(anime) {
        if (!anime) return true;
        if (!anime.lastSyncedAt) return true;

        const SYNC_THRESHOLD_DAYS = 7;
        const lastSynced = new Date(anime.lastSyncedAt);
        const now = new Date();
        const diffDays = Math.floor((now - lastSynced) / (1000 * 60 * 60 * 24));

        return diffDays >= SYNC_THRESHOLD_DAYS;
    }

    /**
     * Transform Anilist anime data to our database schema.
     * @param {Object} anilistData - The anime data from Anilist.
     * @return {Object} - Transformed anime data.
     * @private
     */
    _transformAnilistData(anilistData) {
        return {
            id: anilistData.id,
            titleRomaji: anilistData.title?.romaji || 'Unknown',
            titleEnglish: anilistData.title?.english,
            titleNative: anilistData.title?.native,
            coverImage: anilistData.coverImage?.large || anilistData.coverImage?.medium,
            bannerImage: anilistData.bannerImage,
            status: anilistData.status,
            averageScore: anilistData.averageScore,
            description: anilistData.description,
            isAdult: anilistData.isAdult,
            episodes: anilistData.episodes,
            duration: anilistData.duration,
            season: anilistData.season,
            seasonYear: anilistData.seasonYear,
            studios: anilistData.studios?.nodes,
            source: anilistData.source,
            trailer: anilistData.trailer?.id 
                ? `https://www.youtube.com/watch?v=${anilistData.trailer.id}` 
                : null
        };
    }

    /**
     * Format anime data from database for API response.
     * Converts BigInt to Number and structures the response.
     * @param {Object} anime - The anime data from database.
     * @return {Object} - Formatted anime data.
     * @private
     */
    _formatAnimeResponse(anime) {
        return {
            id: anime.idAnilist,
            title: {
                romaji: anime.titleRomaji,
                english: anime.titleEnglish,
                native: anime.titleNative
            },
            coverImage: anime.coverImage,
            bannerImage: anime.bannerImage,
            status: anime.status,
            averageScore: anime.averageScore,
            description: anime.description,
            isAdult: anime.isAdult,
            episodes: anime.animeMetadata?.episodeCount,
            duration: anime.animeMetadata?.durationMin,
            season: anime.animeMetadata?.season,
            seasonYear: anime.animeMetadata?.seasonYear,
            studio: anime.animeMetadata?.studio,
            source: anime.animeMetadata?.source,
            trailerUrl: anime.animeMetadata?.trailerUrl,
            lastSyncedAt: anime.lastSyncedAt
        };
    }
}

module.exports = new AnimeService();