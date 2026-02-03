/**
 * AniList API Character Type Definitions
 */

import type {
  CharacterEdge,
  CharacterImage,
  CharacterName,
  MediaNode,
  PageInfo,
} from '../anilist.types';

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

export interface MediaCharactersResponse {
  Media: {
    characters: {
      pageInfo: PageInfo;
      edges: CharacterEdge[];
    };
  };
}
