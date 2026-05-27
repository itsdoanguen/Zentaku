/**
 * AniList GraphQL Schedule Query Definitions
 */

export const AIRING_SCHEDULE_QS = `
query ($mediaIds: [Int], $airingAt_greater: Int, $airingAt_lesser: Int, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    airingSchedules(
      mediaId_in: $mediaIds
      airingAt_greater: $airingAt_greater
      airingAt_lesser: $airingAt_lesser
      notYetAired: true
      sort: TIME
    ) {
      id
      airingAt
      timeUntilAiring
      episode
      media {
        id
        title { romaji english native }
        coverImage { large }
        season
        seasonYear
      }
    }
  }
}
`;

export const UP_NEXT_SCHEDULE_QS = `
query ($mediaIds: [Int], $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    airingSchedules(
      mediaId_in: $mediaIds
      notYetAired: true
      sort: TIME
    ) {
      id
      airingAt
      timeUntilAiring
      episode
      media {
        id
        title { romaji english native }
        coverImage { large }
        season
        seasonYear
      }
    }
  }
}
`;
