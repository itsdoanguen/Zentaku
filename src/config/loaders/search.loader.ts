/**
 * Search Module Loader
 * Configures dependency injection for Search module
 *
 * @module SearchLoader
 */

import logger from '../../shared/utils/logger';
import type { Container } from '../container';

/**
 * Load and register search module dependencies
 *
 * @param {Container} container - DI container instance
 */
const loadSearch = (container: Container): void => {
  container.register(
    'animeSearchService',
    (c: Container) => {
      const AnimeSearchService =
        require('../../modules/search/services/anime-search.service').default ||
        require('../../modules/search/services/anime-search.service');

      const animeClient = c.resolve('anilistAnimeClient');
      return new AnimeSearchService(animeClient);
    },
    {
      singleton: true,
      dependencies: ['anilistAnimeClient'],
    }
  );

  container.register(
    'mangaSearchService',
    (c: Container) => {
      const MangaSearchService =
        require('../../modules/search/services/manga-search.service').default ||
        require('../../modules/search/services/manga-search.service');

      const readingMediaClient = c.resolve('anilistReadingMediaClient');
      return new MangaSearchService(readingMediaClient);
    },
    {
      singleton: true,
      dependencies: ['anilistReadingMediaClient'],
    }
  );

  container.register(
    'novelSearchService',
    (c: Container) => {
      const NovelSearchService =
        require('../../modules/search/services/novel-search.service').default ||
        require('../../modules/search/services/novel-search.service');

      const readingMediaClient = c.resolve('anilistReadingMediaClient');
      return new NovelSearchService(readingMediaClient);
    },
    {
      singleton: true,
      dependencies: ['anilistReadingMediaClient'],
    }
  );

  container.register(
    'globalSearchService',
    (c: Container) => {
      const GlobalSearchService =
        require('../../modules/search/services/global-search.service').default ||
        require('../../modules/search/services/global-search.service');

      const animeSearchService = c.resolve('animeSearchService');
      const mangaSearchService = c.resolve('mangaSearchService');
      const novelSearchService = c.resolve('novelSearchService');

      return new GlobalSearchService(animeSearchService, mangaSearchService, novelSearchService);
    },
    {
      singleton: true,
      dependencies: ['animeSearchService', 'mangaSearchService', 'novelSearchService'],
    }
  );

  container.register(
    'trendingService',
    (c: Container) => {
      const TrendingService =
        require('../../modules/search/services/trending.service').default ||
        require('../../modules/search/services/trending.service');

      const animeClient = c.resolve('anilistAnimeClient');
      const readingMediaClient = c.resolve('anilistReadingMediaClient');

      return new TrendingService(animeClient, readingMediaClient);
    },
    {
      singleton: true,
      dependencies: ['anilistAnimeClient', 'anilistReadingMediaClient'],
    }
  );

  container.register(
    'discoveryService',
    (c: Container) => {
      const DiscoveryService =
        require('../../modules/search/services/discovery.service').default ||
        require('../../modules/search/services/discovery.service');

      const animeClient = c.resolve('anilistAnimeClient');
      return new DiscoveryService(animeClient);
    },
    {
      singleton: true,
      dependencies: ['anilistAnimeClient'],
    }
  );

  container.register(
    'searchController',
    (c: Container) => {
      const SearchController =
        require('../../modules/search/search.controller').default ||
        require('../../modules/search/search.controller');

      const globalSearchService = c.resolve('globalSearchService');
      const animeSearchService = c.resolve('animeSearchService');
      const mangaSearchService = c.resolve('mangaSearchService');
      const novelSearchService = c.resolve('novelSearchService');
      const trendingService = c.resolve('trendingService');
      const discoveryService = c.resolve('discoveryService');

      return new SearchController(
        globalSearchService,
        animeSearchService,
        mangaSearchService,
        novelSearchService,
        trendingService,
        discoveryService
      );
    },
    {
      singleton: true,
      dependencies: [
        'globalSearchService',
        'animeSearchService',
        'mangaSearchService',
        'novelSearchService',
        'trendingService',
        'discoveryService',
      ],
    }
  );

  logger.info('[Loader] Search module loaded successfully');
};

export = loadSearch;
