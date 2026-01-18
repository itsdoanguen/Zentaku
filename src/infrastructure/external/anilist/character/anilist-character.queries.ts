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

export const MEDIA_CHARACTERS_QS = `
query ($id: Int, $type: MediaType, $page: Int, $perpage: Int) {
  Media(id: $id, type: $type) {
    characters(page: $page, perPage: $perpage) {
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
      edges {
        node {
          id
          name { full native }
          image { large }
        }
        role
        voiceActors(language: JAPANESE) {
          id
          name { full native }
          image { large }
          language
        }
      }
    }
  }
}
`;
