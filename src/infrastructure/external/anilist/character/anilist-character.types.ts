/**
 * AniList API Character Type Definitions
 * TypeScript interfaces for character-specific GraphQL query responses
 */

import type { CharacterImage, CharacterName, MediaNode } from '../anilist.types';

// ========== Character Types ==========

export interface CharacterInfo {
  id: number;
  name: CharacterName;
  image: CharacterImage;
  description?: string;
  media?: {
    nodes: MediaNode[];
  };
}

// ========== Response Wrappers ==========

export interface CharacterInfoResponse {
  Character: CharacterInfo;
}
