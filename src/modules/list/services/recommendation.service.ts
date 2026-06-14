/**
 * Recommendation Service
 *
 * Handles logic for suggesting anime based on list content
 */

import type AnilistAnimeClient from '../../../infrastructure/external/anilist/anime/AnilistAnimeClient';
import type { IListRepository } from '../types/list.types';
import logger from '../../../shared/utils/logger';

export interface RecommendedAnime {
  idAnilist: number;
  title: { romaji: string; english?: string };
  coverImage: string;
  score: number;
  genres: string[];
  episodes?: number;
  relevanceScore: number;
  recommendedBy: string[];
}

export class RecommendationService {
  constructor(
    private readonly listRepository: IListRepository,
    private readonly animeClient: AnilistAnimeClient
  ) {}

  /**
   * Get anime recommendations for a specific list
   * @param listId The ID of the list
   * @param limit Maximum number of recommendations to return
   */
  async getRecommendationsForList(listId: number, limit: number = 30): Promise<RecommendedAnime[]> {
    // 1. Fetch list items
    const list = await this.listRepository.findListById(listId);
    if (!list || !list.items || list.items.length === 0) {
      return [];
    }

    // 2. Get Anilist IDs and basic info of items currently in the list
    const currentAnilistIds = new Set<number>();
    const animeInList: { idAnilist: number; title: string; score: number; genres: string[] }[] = [];

    for (const item of list.items) {
      if (item.media && item.media.idAnilist) {
        currentAnilistIds.add(item.media.idAnilist);
        animeInList.push({
          idAnilist: item.media.idAnilist,
          title: item.media.titleRomaji || item.media.titleEnglish || 'Unknown',
          score: item.media.averageScore || 0,
          genres: item.media.genres || [],
        });
      }
    }

    if (animeInList.length === 0) {
      return [];
    }

    // 3. Option C: Hybrid Algorithm
    // a. Select top 5 anime by score from the list to get recommendations for
    animeInList.sort((a, b) => b.score - a.score);
    const topAnime = animeInList.slice(0, 5);

    const recommendationMap = new Map<number, RecommendedAnime>();

    // b. Fetch recommendations from AniList for these top anime
    for (const anime of topAnime) {
      try {
        const recs = await this.animeClient.fetchRecommendations(anime.idAnilist, { perPage: 10 });
        if (recs && recs.edges) {
          for (const edge of recs.edges) {
            const node = edge.node;
            if (!node || !node.mediaRecommendation) continue;

            const recMedia = node.mediaRecommendation;
            const recId = recMedia.id;

            // Skip if the anime is already in the custom list
            if (currentAnilistIds.has(recId)) continue;

            const existing = recommendationMap.get(recId);
            if (existing) {
              existing.relevanceScore += node.rating || 1;
              if (!existing.recommendedBy.includes(anime.title)) {
                existing.recommendedBy.push(anime.title);
              }
            } else {
              recommendationMap.set(recId, {
                idAnilist: recId,
                title: {
                  romaji: recMedia.title?.romaji || 'Unknown',
                  english: recMedia.title?.english || undefined,
                },
                coverImage: recMedia.coverImage?.large || recMedia.coverImage?.medium || '',
                score: recMedia.averageScore || 0,
                genres: recMedia.genres || [],
                episodes: recMedia.episodes || undefined,
                relevanceScore: node.rating || 1,
                recommendedBy: [anime.title],
              });
            }
          }
        }
      } catch (error) {
        logger.warn(`Failed to fetch recommendations for anime ${anime.idAnilist}:`, error);
      }
    }

    const results = Array.from(recommendationMap.values());

    // c. Fallback: If results are too few, do genre-based search
    if (results.length < limit) {
      const allGenres = animeInList.flatMap((a) => a.genres);
      const genreCounts = allGenres.reduce(
        (acc, genre) => {
          acc[genre] = (acc[genre] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const topGenres = Object.entries(genreCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((g) => g[0]);

      if (topGenres.length > 0) {
        try {
          const searchResults = await this.animeClient.searchByCriteria(
            { genres: topGenres },
            { perPage: 20, sort: ['POPULARITY_DESC', 'SCORE_DESC'] }
          );

          if (searchResults && searchResults.media) {
            for (const item of searchResults.media) {
              if (currentAnilistIds.has(item.id) || recommendationMap.has(item.id)) continue;

              results.push({
                idAnilist: item.id,
                title: {
                  romaji: item.title?.romaji || 'Unknown',
                  english: item.title?.english || undefined,
                },
                coverImage: item.coverImage?.large || '',
                score: item.averageScore || 0,
                genres: (item as any).genres || [],
                episodes: item.episodes || undefined,
                relevanceScore: 0, // Fallback has lower priority
                recommendedBy: ['Thể loại tương tự'],
              });
            }
          }
        } catch (error) {
          logger.warn(`Failed to fetch genre fallback recommendations:`, error);
        }
      }
    }

    // 4. Sort by relevance and score, then limit
    results.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.score - a.score;
    });

    return results.slice(0, limit);
  }
}
