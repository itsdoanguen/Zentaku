/**
 * MALSync API Client
 *
 * @module MalSyncClient
 */

import type { AxiosError } from 'axios';
import logger from '../../../shared/utils/logger';
import httpClient from '../../http/httpClient';
import type { MalSyncError, MalSyncResponse } from './malsync.types';

class MalSyncClient {
  private readonly baseUrl = 'https://api.malsync.moe';

  /**
   * Get anime mapping from AniList ID to various streaming sites
   *
   * @param anilistId - AniList anime ID
   * @returns MALSync response with site mappings
   * @throws Error if API request fails or anime not found
   *
   * @example
   * const mapping = await client.getAnimeMapping(21); // One Piece
   * // Returns: { id, title, Sites: { Zoro: { ... } } }
   */
  async getAnimeMapping(anilistId: number): Promise<MalSyncResponse> {
    try {
      logger.info(`[MALSync] Fetching mapping for AniList ID: ${anilistId}`);

      const response = await httpClient.get<MalSyncResponse>(
        `${this.baseUrl}/mal/anime/anilist:${anilistId}`
      );

      logger.info(
        `[MALSync] Successfully fetched mapping for "${response.data.title}" (ID: ${anilistId})`
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<MalSyncError>;

      if (axiosError.response?.status === 404) {
        logger.warn(`[MALSync] Anime with AniList ID ${anilistId} not found in MALSync database`);
        throw new Error(`Anime with AniList ID ${anilistId} not found in MALSync`);
      }

      logger.error(`[MALSync] Failed to fetch mapping for AniList ID ${anilistId}:`, error);
      throw new Error(
        `Failed to fetch anime mapping from MALSync: ${axiosError.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Extract HiAnime (Zoro) identifier from MALSync response
   *
   * @param response - MALSync API response
   * @returns HiAnime identifier or null if not found
   *
   * @example
   * const response = await client.getAnimeMapping(21);
   * const hianimeId = client.extractHianimeId(response);
   * // Returns: "one-piece-100" (full slug from URL)
   */
  extractHianimeId(response: MalSyncResponse): string | null {
    if (!response.Sites?.Zoro) {
      logger.warn(
        `[MALSync] No HiAnime (Zoro) mapping found for "${response.title}" (AniList: ${response.id})`
      );
      return null;
    }

    const zoroEntries = Object.values(response.Sites.Zoro);

    if (zoroEntries.length === 0) {
      logger.warn(`[MALSync] Empty Zoro mapping for "${response.title}"`);
      return null;
    }

    const zoroSite = zoroEntries[0];

    if (!zoroSite) {
      logger.warn(`[MALSync] Invalid Zoro entry for "${response.title}"`);
      return null;
    }

    //"https://hianime.to/one-piece-100" → "one-piece-100"
    if (!zoroSite.url) {
      logger.warn(`[MALSync] Missing URL for "${response.title}"`);
      return null;
    }

    try {
      const url = new URL(zoroSite.url);
      const hianimeId = url.pathname.substring(1);

      if (!hianimeId) {
        logger.warn(`[MALSync] Could not extract HiAnime ID from URL: ${zoroSite.url}`);
        return null;
      }

      logger.info(
        `[MALSync] Extracted HiAnime ID "${hianimeId}" for "${response.title}" from URL: ${zoroSite.url}`
      );

      return hianimeId;
    } catch (error) {
      logger.error(`[MALSync] Failed to parse URL "${zoroSite.url}":`, error);
      return null;
    }
  }

  async getHianimeIdByAnilistId(anilistId: number): Promise<string | null> {
    const mapping = await this.getAnimeMapping(anilistId);
    return this.extractHianimeId(mapping);
  }

  async isAvailableOnHianime(anilistId: number): Promise<boolean> {
    try {
      const hianimeId = await this.getHianimeIdByAnilistId(anilistId);
      return hianimeId !== null;
    } catch (error) {
      logger.error(`[MALSync] Error checking HiAnime availability for ${anilistId}:`, error);
      return false;
    }
  }
}

export default MalSyncClient;
