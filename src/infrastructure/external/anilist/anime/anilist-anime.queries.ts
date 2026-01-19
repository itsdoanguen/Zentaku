/**
 * AniList GraphQL Anime Query Definitions
 * Contains all GraphQL queries for anime-specific operations
 */

export const ANIME_OVERVIEW_QS = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
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

export const ANIME_INFO_QS = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    idMal
    siteUrl
    title { romaji english native }
    synonyms
    format
    episodes
    duration
    status
    startDate { year month day }
    endDate { year month day }
    season
    seasonYear
    coverImage { large }
    bannerImage
    description
    isAdult
    averageScore
    meanScore
    popularity
    favourites
    genres
    tags { id name }
    source
    hashtag
    studios { nodes { id name } }
    trailer { id site thumbnail }
    nextAiringEpisode { airingAt timeUntilAiring episode }
  }
}
`;

export const ANIME_INFO_LIGHTWEIGHT_QS = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji english native }
    coverImage { large }
    episodes
    nextAiringEpisode { airingAt timeUntilAiring episode }
  }
}
`;

export const ANIME_COVERS_BATCH_QS = `
query ($ids: [Int]) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, type: ANIME) {
      id
      coverImage { large }
    }
  }
}
`;

export const ANIME_ID_SEARCH_QS = `
query ($query: String, $page: Int, $perpage: Int) {
  Page (page: $page, perPage: $perpage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media (search: $query, type: ANIME) {
      id
      title { romaji english native }
      coverImage { large }
      averageScore
      popularity
      episodes
      season
      isAdult
    }
  }
}
`;

export const ANIME_SEASON_TREND_QS = `
query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perpage: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perpage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: $sort) {
      id
      title { romaji english native }
      coverImage { large }
      bannerImage
      averageScore
      popularity
      episodes
      season
      isAdult
      nextAiringEpisode { airingAt timeUntilAiring episode }
      trending
    }
  }
}
`;

export const ANIME_SEARCH_CRITERIA_QS = `
query ($genres: [String], $season: MediaSeason, $seasonYear: Int, $format: MediaFormat, $status: MediaStatus, $page: Int, $perpage: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perpage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(genre_in: $genres, season: $season, seasonYear: $seasonYear, format: $format, status: $status, type: ANIME, sort: $sort) {
      id
      title { romaji english native }
      coverImage { large }
      bannerImage
      averageScore
      popularity
      episodes
      season
      genres
      isAdult
      nextAiringEpisode { airingAt timeUntilAiring episode }
      trending
    }
  }
}
`;

export const ANIME_STATS_QS = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
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

export const ANIME_WHERE_TO_WATCH_QS = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    streamingEpisodes {
      title
      url
      site
    }
  }
}
`;

export const ANIME_BATCH_INFO_QS = `
query ($ids: [Int]) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, type: ANIME) {
      id
      title { romaji english native }
      coverImage { large }
      episodes
    }
  }
}
`;
