import type { ExternalIdField, MediaType } from '../../core/base/BaseMediaService';
import { BaseMediaService } from '../../core/base/BaseMediaService';
import type AnilistCharacterClient from '../../infrastructure/external/anilist/character/AnilistCharacterClient';
import type AnilistMangaClient from '../../infrastructure/external/anilist/manga/AnilistMangaClient';
import type AnilistStaffClient from '../../infrastructure/external/anilist/staff/AnilistStaffClient';
import type MangaAdapter from './manga.adapter';
import type MangaRepository from './manga.repository';

class MangaService extends BaseMediaService {
  protected override readonly dbRepository: MangaRepository;
  protected override readonly externalClient: AnilistMangaClient;
  protected override readonly adapter: MangaAdapter;
  protected override readonly characterClient?: AnilistCharacterClient;
  protected override readonly staffClient?: AnilistStaffClient;

  constructor(
    mangaRepository: MangaRepository,
    mangaAdapter: MangaAdapter,
    anilistMangaClient: AnilistMangaClient,
    anilistCharacterClient?: AnilistCharacterClient,
    anilistStaffClient?: AnilistStaffClient
  ) {
    super(
      mangaRepository,
      anilistMangaClient,
      mangaAdapter,
      anilistCharacterClient,
      anilistStaffClient
    );
    this.dbRepository = mangaRepository;
    this.externalClient = anilistMangaClient;
    this.adapter = mangaAdapter;
    this.characterClient = anilistCharacterClient;
    this.staffClient = anilistStaffClient;
  }

  getMediaType(): MediaType {
    return 'MANGA';
  }

  getExternalIdField(): ExternalIdField {
    return 'idAnilist';
  }

  async getMangaDetails(anilistId: number): Promise<unknown> {
    return this.getDetails(anilistId);
  }

  async getMangaOverview(anilistId: number): Promise<unknown> {
    return this.getOverview(anilistId);
  }

  async getMangaCharacters(
    anilistId: number,
    page: number = 1,
    perPage: number = 25
  ): Promise<unknown> {
    return this.getCharacters(anilistId, page, perPage);
  }

  async getMangaStaff(anilistId: number, page: number = 1, perPage: number = 25): Promise<unknown> {
    return this.getStaff(anilistId, page, perPage);
  }

  async getMangaStatistics(anilistId: number): Promise<unknown> {
    return this.getStatistics(anilistId);
  }
}

export default MangaService;
