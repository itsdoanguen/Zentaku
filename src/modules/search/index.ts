export { default as SearchController } from './search.controller';
export { default as SearchValidator } from './search.validator';

export { default as AnimeSearchService } from './services/anime-search.service';
export { default as DiscoveryService } from './services/discovery.service';
export { default as GlobalSearchService } from './services/global-search.service';
export { default as MangaSearchService } from './services/manga-search.service';
export { default as NovelSearchService } from './services/novel-search.service';
export { default as TrendingService } from './services/trending.service';

export * from './types/criteria.types';
export * from './types/discovery.types';
export * from './types/search.types';
export { searchRoutes };

import searchRoutes = require('./search.routes');
