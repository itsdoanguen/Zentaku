import { NotFoundError } from '../../../../shared/utils/error';
import AnilistClient from '../AnilistClient';
import { STAFF_INFO_QS } from './anilist-staff.queries';
import type { StaffInfo, StaffInfoResponse } from './anilist-staff.types';

/**
 * AniList Staff Client
 * Handles all staff-specific operations
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
}

export default AnilistStaffClient;
