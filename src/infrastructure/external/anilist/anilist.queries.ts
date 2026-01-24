/**
 * AniList GraphQL Shared Query Definitions
 * Contains common/shared GraphQL queries used across multiple media types
 */

export const MEDIA_OVERVIEW_QS = `
query ($id: Int, $type: MediaType) {
  Media(id: $id, type: $type) {
    id
    
    relations {
      edges {
        id
        relationType
        node {
          id
          type
          format
          title {
            romaji
            english
            native
          }
          coverImage {
            large
          }
          status
          episodes
          chapters
          volumes
          averageScore
        }
      }
    }
    
    characters(page: 1, perPage: 6, sort: [ROLE, RELEVANCE]) {
      edges {
        id
        role
        voiceActors(language: JAPANESE, sort: [RELEVANCE]) {
          id
          name {
            full
            native
          }
          image {
            large
          }
          language
        }
        node {
          id
          name {
            full
            native
          }
          image {
            large
          }
        }
      }
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
    }
    
    staff(page: 1, perPage: 6, sort: [RELEVANCE]) {
      edges {
        id
        role
        node {
          id
          name {
            full
            native
          }
          image {
            large
          }
          primaryOccupations
        }
      }
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
    }
    
    stats {
      scoreDistribution {
        score
        amount
      }
      statusDistribution {
        status
        amount
      }
    }
    
    rankings {
      id
      rank
      type
      format
      year
      season
      allTime
      context
    }
    
    recommendations(page: 1, perPage: 6, sort: [RATING_DESC]) {
      edges {
        node {
          id
          rating
          userRating
          mediaRecommendation {
            id
            type
            format
            title {
              romaji
              english
              native
            }
            coverImage {
              large
            }
            averageScore
            popularity
            favourites
            episodes
            chapters
            volumes
          }
        }
      }
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
      }
    }
  }
}
`;

export const MEDIA_RELATIONS_QS = `
query ($id: Int, $type: MediaType) {
  Media(id: $id, type: $type) {
    id
    relations {
      edges {
        id
        relationType
        node {
          id
          type
          format
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            medium
          }
          bannerImage
          status
          episodes
          chapters
          volumes
          averageScore
          meanScore
          popularity
          favourites
          startDate {
            year
            month
            day
          }
          endDate {
            year
            month
            day
          }
          season
          seasonYear
        }
      }
    }
  }
}
`;

export const MEDIA_RECOMMENDATIONS_QS = `
query ($id: Int, $type: MediaType, $page: Int, $perPage: Int) {
  Media(id: $id, type: $type) {
    id
    recommendations(page: $page, perPage: $perPage, sort: [RATING_DESC]) {
      edges {
        node {
          id
          rating
          userRating
          mediaRecommendation {
            id
            type
            format
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            bannerImage
            averageScore
            meanScore
            popularity
            favourites
            episodes
            chapters
            volumes
            status
            startDate {
              year
              month
              day
            }
            season
            seasonYear
            genres
            isAdult
          }
        }
      }
      pageInfo {
        total
        currentPage
        lastPage
        hasNextPage
        perPage
      }
    }
  }
}
`;

export const MEDIA_STATISTICS_QS = `
query ($id: Int, $type: MediaType) {
  Media(id: $id, type: $type) {
    id
    averageScore
    meanScore
    rankings {
      id
      rank
      type
      format
      year
      season
      allTime
      context
    }
    stats {
      scoreDistribution {
        score
        amount
      }
      statusDistribution {
        status
        amount
      }
    }
  }
}
`;
