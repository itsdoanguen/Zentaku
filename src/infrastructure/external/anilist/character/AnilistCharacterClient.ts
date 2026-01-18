import { NotFoundError } from '../../../../shared/utils/error';
import AnilistClient from '../AnilistClient';
import { CHARACTER_INFO_QS } from './anilist-character.queries';
import type { CharacterInfo, CharacterInfoResponse } from './anilist-character.types';

/**
 * AniList Character Client
 * Handles all character-specific operations
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
}

export default AnilistCharacterClient;
