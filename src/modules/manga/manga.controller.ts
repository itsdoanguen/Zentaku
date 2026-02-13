import { BaseMediaController } from '../../core/base/BaseMediaController';
import type MangaService from './manga.service';

class MangaController extends BaseMediaController<MangaService> {
  constructor(mangaService: MangaService) {
    super(mangaService);

    this.getBasicInfo = this.getBasicInfo.bind(this);
    this.getOverview = this.getOverview.bind(this);
    this.getCharacters = this.getCharacters.bind(this);
    this.getStaff = this.getStaff.bind(this);
    this.getStatistics = this.getStatistics.bind(this);
  }
}

export default MangaController;
