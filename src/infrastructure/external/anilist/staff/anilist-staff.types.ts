/**
 * AniList API Staff Type Definitions
 * TypeScript interfaces for staff-specific GraphQL query responses
 */

import type {
  CharacterImage,
  CharacterName,
  MediaDate,
  MediaNode,
  PageInfo,
  StaffEdge,
} from '../anilist.types';

// ========== Staff Types ==========

export interface StaffInfo {
  id: number;
  name: CharacterName;
  image: CharacterImage;
  description?: string;
  languageV2?: string;
  gender?: string;
  dateOfBirth?: MediaDate;
  dateOfDeath?: MediaDate;
  age?: number;
  yearsActive?: number[];
  homeTown?: string;
  bloodType?: string;
  primaryOccupations?: string[];
  staffMedia?: {
    nodes: MediaNode[];
  };
}

// ========== Response Wrappers ==========

export interface StaffInfoResponse {
  Staff: StaffInfo;
}

export interface MediaStaffResponse {
  Media: {
    staff: {
      pageInfo: PageInfo;
      edges: StaffEdge[];
    };
  };
}
