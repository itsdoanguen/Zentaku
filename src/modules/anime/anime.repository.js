const prisma = require('../../config/database')
const { NotFoundError } = require('../../shared/utils/error');

class AnimeRepository {
    /**
     * Find anime details by ID in database.
     * @param {number} anilistId - The ID of the anime to fetch.
     * @returns {Promise<Object>} - The anime details.
     * @throws {NotFoundError} - If the anime with the given ID does not exist.
     */
    async findAnimeById(anilistId) {
        try {
            const anime = await prisma.mediaItem.findUnique({
                where: {
                    idAnilist: anilistId
                },
                include: {
                    animeMetadata: true
                }
            });

            return anime;
        } catch (error) {
            throw new Error(`Failed to fetch anime with ID ${anilistId}: ${error.message}`);
        }
    }

    /**
     * Create or update a new anime entry in the database.
     * @param {Object} animeData - The data of the anime to create or update.
     * @returns {Promise<Object>} - The created or updated anime entry.
     */
    async upsertAnime(animeData) {
        try {
            const {
                id: anilistId,
                titleRomaji,
                titleEnglish,
                titleNative,
                coverImage,
                bannerImage,
                status,
                averageScore,
                description,
                isAdult,
                // Anime-specific fields
                episodes,
                duration,
                season,
                seasonYear,
                studios,
                source,
                trailer
            } = animeData;

            const anime = await prisma.mediaItem.upsert({
                where: {
                    idAnilist: anilistId
                },
                update: {
                    titleRomaji,
                    titleEnglish,
                    titleNative,
                    coverImage,
                    bannerImage,
                    status,
                    averageScore: averageScore ? averageScore / 10 : null, // Convert 0-100 to 0-10
                    description,
                    isAdult: isAdult || false,
                    lastSyncedAt: new Date(),
                    animeMetadata: {
                        upsert: {
                            create: {
                                episodeCount: episodes,
                                durationMin: duration,
                                season,
                                seasonYear,
                                studio: studios?.[0]?.name || null,
                                source,
                                trailerUrl: trailer
                            },
                            update: {
                                episodeCount: episodes,
                                durationMin: duration,
                                season,
                                seasonYear,
                                studio: studios?.[0]?.name || null,
                                source,
                                trailerUrl: trailer
                            }
                        }
                    }
                },
                create: {
                    idAnilist: anilistId,
                    titleRomaji,
                    titleEnglish,
                    titleNative,
                    type: 'ANIME',
                    status,
                    coverImage,
                    bannerImage,
                    averageScore: averageScore ? averageScore / 10 : null,
                    description,
                    isAdult: isAdult || false,
                    lastSyncedAt: new Date(),
                    animeMetadata: {
                        create: {
                            episodeCount: episodes,
                            durationMin: duration,
                            season,
                            seasonYear,
                            studio: studios?.[0]?.name || null,
                            source,
                            trailerUrl: trailer
                        }
                    }
                },
                include: {
                    animeMetadata: true
                }
            });

            return anime;
        } catch (error) {
            throw new Error(`Database upsert error: ${error.message}`);
        }
    }
}

module.exports = AnimeRepository;