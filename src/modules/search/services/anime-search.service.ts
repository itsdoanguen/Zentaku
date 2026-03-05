import type AnilistAnimeClient from '../../../infrastructure/external/anilist/anime/AnilistAnimeClient';
import type { AnimeSearchCriteria } from '../types/criteria.types';
import type { MediaSearchParams, SearchResult } from '../types/search.types';

/**
 * Anime Search Service
 * Orchestrates anime search by calling external API client directly
 */
class AnimeSearchService {
  private animeClient: AnilistAnimeClient;

  constructor(animeClient: AnilistAnimeClient) {
    this.animeClient = animeClient;
  }

  async searchByText(params: MediaSearchParams): Promise<SearchResult<unknown>> {
    const { q, page = 1, perPage = 20 } = params;

    const results = await this.animeClient.search(q, { page, perPage });

    return {
      success: true,
      data: {
        items: results.media,
        pageInfo: {
          total: results.pageInfo.total || 0,
          currentPage: results.pageInfo.currentPage || page,
          lastPage: results.pageInfo.lastPage || 1,
          hasNextPage: results.pageInfo.hasNextPage || false,
          perPage: results.pageInfo.perPage || perPage,
        },
        source: 'external',
      },
    };
  }

  async searchByCriteria(
    criteria: AnimeSearchCriteria,
    options: { page?: number; perPage?: number } = {}
  ): Promise<SearchResult<unknown>> {
    const { page = 1, perPage = 20 } = options;
    const { sort, format, status, genres, season, seasonYear } = criteria;

    const results = await this.animeClient.searchByCriteria(
      {
        genres,
        season,
        seasonYear,
        format: format ? format[0] : undefined,
        status: status ? status[0] : undefined,
      },
      {
        page,
        perPage,
        sort: sort || ['POPULARITY_DESC'],
      }
    );

    return {
      success: true,
      data: {
        items: results.media,
        pageInfo: {
          total: results.pageInfo.total || 0,
          currentPage: results.pageInfo.currentPage || page,
          lastPage: results.pageInfo.lastPage || 1,
          hasNextPage: results.pageInfo.hasNextPage || false,
          perPage: results.pageInfo.perPage || perPage,
        },
        source: 'external',
      },
    };
  }

  async getCurrentlyAiring(page: number = 1, perPage: number = 20): Promise<SearchResult<unknown>> {
    return this.searchByCriteria(
      {
        status: ['RELEASING'],
        sort: ['POPULARITY_DESC'],
      },
      { page, perPage }
    );
  }

  async getSeasonal(
    season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL',
    year: number,
    options: { page?: number; perPage?: number; sort?: string[] } = {}
  ): Promise<SearchResult<unknown>> {
    const { page = 1, perPage = 20, sort = ['POPULARITY_DESC'] } = options;

    const results = await this.animeClient.fetchSeasonal(season, year, {
      page,
      perPage,
      sort,
    });

    return {
      success: true,
      data: {
        items: results.media,
        pageInfo: {
          total: results.pageInfo.total || 0,
          currentPage: results.pageInfo.currentPage || page,
          lastPage: results.pageInfo.lastPage || 1,
          hasNextPage: results.pageInfo.hasNextPage || false,
          perPage: results.pageInfo.perPage || perPage,
        },
        source: 'external',
      },
    };
  }
}

export default AnimeSearchService;
