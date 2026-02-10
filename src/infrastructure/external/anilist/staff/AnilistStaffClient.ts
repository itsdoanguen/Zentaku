import { NotFoundError } from '../../../../shared/utils/error';
import type { PageInfo, StaffEdge } from '../anilist.types';
import AnilistClient from '../AnilistClient';
import { MEDIA_STAFF_QS, STAFF_INFO_QS } from './anilist-staff.queries';
import type { MediaStaffResponse, StaffInfo, StaffInfoResponse } from './anilist-staff.types';

/**
 * AniList Staff Client
 *
 * @extends {AnilistClient}
 */
class AnilistStaffClient extends AnilistClient {
  /**
   * Fetch detailed staff information by ID
   *
   * @param {number} staffId - Staff ID
   * @returns {Promise<StaffInfo>} - Staff information
   * @throws {NotFoundError} - If staff not found
   */
  async fetchById(staffId: number): Promise<StaffInfo> {
    const data = await this.executeQuery<StaffInfoResponse>(
      STAFF_INFO_QS,
      { id: staffId },
      `fetchStaffById(${staffId})`
    );

    if (!data?.Staff) {
      throw new NotFoundError(`Staff with ID ${staffId} not found`);
    }

    return data.Staff;
  }

  /**
   * Fetch staff for ANY media (anime, manga, novel)
   *
   * @param {number} mediaId - Media ID
   * @param {'ANIME' | 'MANGA'} mediaType - Media type
   * @param {object} options - Pagination options
   * @returns {Promise<{ pageInfo: PageInfo; edges: StaffEdge[] }>} - Staff with pageInfo and edges
   */
  async fetchByMediaId(
    mediaId: number,
    mediaType: 'ANIME' | 'MANGA',
    options: { page?: number; perPage?: number } = {}
  ): Promise<{ pageInfo: PageInfo; edges: StaffEdge[] }> {
    const { page = 1, perPage = 25 } = options;

    const data = await this.executeQuery<MediaStaffResponse>(
      MEDIA_STAFF_QS,
      { id: mediaId, type: mediaType, page, perpage: perPage },
      `fetchStaff(${mediaType}:${mediaId})`
    );

    return {
      pageInfo: data.Media?.staff?.pageInfo || ({} as PageInfo),
      edges: data.Media?.staff?.edges || [],
    };
  }
}

export default AnilistStaffClient;
