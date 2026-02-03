import { NotFoundError } from '../../../../shared/utils/error';
import type { CharacterEdge, PageInfo } from '../anilist.types';
import AnilistClient from '../AnilistClient';
import { CHARACTER_INFO_QS, MEDIA_CHARACTERS_QS } from './anilist-character.queries';
import type {
  CharacterInfo,
  CharacterInfoResponse,
  MediaCharactersResponse,
} from './anilist-character.types';

/**
 * AniList Character Client
 *
 * @extends {AnilistClient}
 */
class AnilistCharacterClient extends AnilistClient {
  /**
   * Fetch detailed character information by ID
   *
   * @param {number} characterId - Character ID
   * @returns {Promise<CharacterInfo>} - Character information
   * @throws {NotFoundError} - If character not found
   */
  async fetchById(characterId: number): Promise<CharacterInfo> {
    const data = await this.executeQuery<CharacterInfoResponse>(
      CHARACTER_INFO_QS,
      { id: characterId },
      `fetchCharacterById(${characterId})`
    );

    if (!data?.Character) {
      throw new NotFoundError(`Character with ID ${characterId} not found`);
    }

    return data.Character;
  }

  /**
   * Fetch characters for ANY media (anime, manga, novel)
   *
   * @param {number} mediaId - Media ID
   * @param {'ANIME' | 'MANGA'} mediaType - Media type
   * @param {object} options - Pagination options
   * @returns {Promise<{ pageInfo: PageInfo; edges: CharacterEdge[] }>} - Characters with pageInfo and edges
   */
  async fetchByMediaId(
    mediaId: number,
    mediaType: 'ANIME' | 'MANGA',
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; edges: CharacterEdge[] }> {
    const { page = 1, perPage = 25 } = options;

    const data = await this.executeQuery<MediaCharactersResponse>(
      MEDIA_CHARACTERS_QS,
      { id: mediaId, type: mediaType, page, perpage: perPage },
      `fetchCharacters(${mediaType}:${mediaId})`
    );

    return {
      pageInfo: data.Media?.characters?.pageInfo || ({} as PageInfo),
      edges: data.Media?.characters?.edges || [],
    };
  }
}

export default AnilistCharacterClient;
