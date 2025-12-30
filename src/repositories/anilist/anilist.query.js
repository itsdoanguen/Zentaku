/**
 * AniList GraphQL Query Definitions
 * Contains all GraphQL queries for interacting with AniList API
 */

const ANIME_INFO_QS = `
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

const ANIME_INFO_LIGHTWEIGHT_QS = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title { romaji }
    coverImage { large }
    episodes
    nextAiringEpisode { airingAt timeUntilAiring episode }
  }
}
`;

const ANIME_COVERS_BATCH_QS = `
query ($ids: [Int]) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, type: ANIME) {
      id
      coverImage { large }
    }
  }
}
`;

const ANIME_ID_SEARCH_QS = `
query ($query: String, $page: Int, $perpage: Int) {
  Page (page: $page, perPage: $perpage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media (search: $query, type: ANIME) {
      id
      title { romaji english }
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

const ANIME_SEASON_TREND_QS = `
query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perpage: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perpage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: $sort) {
      id
      title { romaji english }
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

const ANIME_SEARCH_CRITERIA_QS = `
query ($genres: [String], $season: MediaSeason, $seasonYear: Int, $format: MediaFormat, $status: MediaStatus, $page: Int, $perpage: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perpage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(genre_in: $genres, season: $season, seasonYear: $seasonYear, format: $format, status: $status, type: ANIME, sort: $sort) {
      id
      title { romaji english }
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

const ANIME_CHARACTERS_QS = `
query ($id: Int, $page: Int, $perpage: Int) {
  Media(id: $id) {
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
        voiceActors {
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

const ANIME_STAFF_QS = `
query ($id: Int, $page: Int, $perpage: Int) {
  Media(id: $id) {
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

const ANIME_STATS_QS = `
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

const ANIME_WHERE_TO_WATCH_QS = `
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

const ANIME_BATCH_INFO_QS = `
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

const CHARACTER_INFO_QS = `
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

const STAFF_INFO_QS = `
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

module.exports = {
  ANIME_INFO_QS,
  ANIME_INFO_LIGHTWEIGHT_QS,
  ANIME_COVERS_BATCH_QS,
  ANIME_ID_SEARCH_QS,
  ANIME_SEASON_TREND_QS,
  ANIME_SEARCH_CRITERIA_QS,
  ANIME_CHARACTERS_QS,
  ANIME_STAFF_QS,
  ANIME_STATS_QS,
  ANIME_WHERE_TO_WATCH_QS,
  ANIME_BATCH_INFO_QS,
  CHARACTER_INFO_QS,
  STAFF_INFO_QS,
};
