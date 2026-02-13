import type { Request, Response } from 'express';
import { BaseMediaController } from '../../core/base/BaseMediaController';
import type ReadingMediaService from './reading-media.service';

/**
 * Reading Media Controller
 * Handles both Manga and Novel endpoints with format validation
 */
class ReadingMediaController extends BaseMediaController<ReadingMediaService> {
  protected override readonly service: ReadingMediaService;

  constructor(readingMediaService: ReadingMediaService) {
    super(readingMediaService);
    this.service = readingMediaService;

    // Bind base methods
    this.getBasicInfo = this.getBasicInfo.bind(this);
    this.getOverview = this.getOverview.bind(this);
    this.getCharacters = this.getCharacters.bind(this);
    this.getStaff = this.getStaff.bind(this);
    this.getStatistics = this.getStatistics.bind(this);

    // Bind manga-specific methods
    this.getMangaBasicInfo = this.getMangaBasicInfo.bind(this);
    this.getMangaOverview = this.getMangaOverview.bind(this);
    this.getMangaCharacters = this.getMangaCharacters.bind(this);
    this.getMangaStaff = this.getMangaStaff.bind(this);
    this.getMangaStatistics = this.getMangaStatistics.bind(this);
    this.searchManga = this.searchManga.bind(this);

    // Bind novel-specific methods
    this.getNovelBasicInfo = this.getNovelBasicInfo.bind(this);
    this.getNovelOverview = this.getNovelOverview.bind(this);
    this.getNovelCharacters = this.getNovelCharacters.bind(this);
    this.getNovelStaff = this.getNovelStaff.bind(this);
    this.getNovelStatistics = this.getNovelStatistics.bind(this);
    this.searchNovels = this.searchNovels.bind(this);
  }

  // ==================== MANGA ENDPOINTS ====================

  async getMangaBasicInfo(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching manga details', { anilistId });

    const manga = await this.service.getMangaDetails(anilistId);

    return this.success(res, manga);
  }

  async getMangaOverview(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching manga overview', { anilistId });

    const overview = await this.service.getMangaOverview(anilistId);

    return this.success(res, overview);
  }

  async getMangaCharacters(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    const { page, perPage } = this.getPaginationParams(req, {
      page: 1,
      perPage: 25,
      maxPerPage: 50,
    });

    this.logInfo('Fetching manga characters', { anilistId, page, perPage });

    const characters = await this.service.getMangaCharacters(anilistId, page, perPage);

    return this.success(res, characters);
  }

  async getMangaStaff(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    const { page, perPage } = this.getPaginationParams(req, {
      page: 1,
      perPage: 25,
      maxPerPage: 50,
    });

    this.logInfo('Fetching manga staff', { anilistId, page, perPage });

    const staff = await this.service.getMangaStaff(anilistId, page, perPage);

    return this.success(res, staff);
  }

  async getMangaStatistics(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching manga statistics', { anilistId });

    const statistics = await this.service.getMangaStatistics(anilistId);

    return this.success(res, statistics);
  }

  async searchManga(req: Request, res: Response): Promise<Response> {
    const query = this.getStringQuery(req, 'q') || this.getStringQuery(req, 'query', '');
    const { page, perPage } = this.getPaginationParams(req, {
      page: 1,
      perPage: 20,
      maxPerPage: 50,
    });

    this.logInfo('Searching manga', { query, page, perPage });

    const results = await this.service.searchManga(query, page, perPage);

    return this.success(res, results);
  }

  // ==================== NOVEL ENDPOINTS ====================

  async getNovelBasicInfo(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching novel details', { anilistId });

    const novel = await this.service.getNovelDetails(anilistId);

    return this.success(res, novel);
  }

  async getNovelOverview(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching novel overview', { anilistId });

    const overview = await this.service.getNovelOverview(anilistId);

    return this.success(res, overview);
  }

  async getNovelCharacters(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    const { page, perPage } = this.getPaginationParams(req, {
      page: 1,
      perPage: 25,
      maxPerPage: 50,
    });

    this.logInfo('Fetching novel characters', { anilistId, page, perPage });

    const characters = await this.service.getNovelCharacters(anilistId, page, perPage);

    return this.success(res, characters);
  }

  async getNovelStaff(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    const { page, perPage } = this.getPaginationParams(req, {
      page: 1,
      perPage: 25,
      maxPerPage: 50,
    });

    this.logInfo('Fetching novel staff', { anilistId, page, perPage });

    const staff = await this.service.getNovelStaff(anilistId, page, perPage);

    return this.success(res, staff);
  }

  async getNovelStatistics(req: Request, res: Response): Promise<Response> {
    const anilistId = this.getIntParam(req, 'anilistId');
    this.logInfo('Fetching novel statistics', { anilistId });

    const statistics = await this.service.getNovelStatistics(anilistId);

    return this.success(res, statistics);
  }

  async searchNovels(req: Request, res: Response): Promise<Response> {
    const query = this.getStringQuery(req, 'q') || this.getStringQuery(req, 'query', '');
    const { page, perPage } = this.getPaginationParams(req, {
      page: 1,
      perPage: 20,
      maxPerPage: 50,
    });

    this.logInfo('Searching novels', { query, page, perPage });

    const results = await this.service.searchNovels(query, page, perPage);

    return this.success(res, results);
  }
}

export default ReadingMediaController;
