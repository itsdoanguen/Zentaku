/**
 * AniList GraphQL Character Query Definitions
 * Contains all GraphQL queries for character-specific operations
 */

export const CHARACTER_INFO_QS = `
query ($id: Int) {
  Character(id: $id) {
    id
    name { full native }
    image { large }
    description
    media {
      nodes {
        id
        title { romaji english }
        coverImage { large }
        type
        format
        status
        episodes
        season
        seasonYear
      }
    }
  }
}
`;
