/**
 * AniList GraphQL Staff Query Definitions
 * Contains all GraphQL queries for staff-specific operations
 */

export const STAFF_INFO_QS = `
query ($id: Int) {
  Staff(id: $id) {
    id
    name { full native }
    image { large }
    description
    languageV2
    gender
    dateOfBirth { year month day }
    dateOfDeath { year month day }
    age
    yearsActive
    homeTown
    bloodType
    primaryOccupations
    staffMedia(page: 1, perPage: 25, sort: POPULARITY_DESC) {
      nodes {
        id
        title { romaji english native }
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

export const MEDIA_STAFF_QS = `
query ($id: Int, $type: MediaType, $page: Int, $perpage: Int) {
  Media(id: $id, type: $type) {
    staff(page: $page, perPage: $perpage) {
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
      }
    }
  }
}
`;
