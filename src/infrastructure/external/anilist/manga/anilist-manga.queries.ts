/**
 * AniList GraphQL Manga Query Definitions
 * Contains all GraphQL queries for manga-specific operations
 */

export const MANGA_INFO_QS = `
query ($id: Int) {
  Media(id: $id, type: MANGA) {
    id
    idMal
    siteUrl
    title { romaji english native }
    synonyms
    format
    chapters
    volumes
    status
    startDate { year month day }
    endDate { year month day }
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
    countryOfOrigin
    isLicensed
  }
}
`;

export const MANGA_INFO_LIGHTWEIGHT_QS = `
query ($id: Int) {
  Media(id: $id, type: MANGA) {
    id
    title { romaji english native }
    coverImage { large }
    chapters
    volumes
  }
}
`;

export const MANGA_COVERS_BATCH_QS = `
query ($ids: [Int]) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, type: MANGA) {
      id
      coverImage { large }
    }
  }
}
`;

export const MANGA_ID_SEARCH_QS = `
query ($query: String, $page: Int, $perpage: Int) {
  Page (page: $page, perPage: $perpage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media (search: $query, type: MANGA) {
      id
      title { romaji english native }
      coverImage { large }
      averageScore
      popularity
      chapters
      volumes
      format
      isAdult
    }
  }
}
`;

export const MANGA_SEARCH_CRITERIA_QS = `
query ($genres: [String], $format: MediaFormat, $status: MediaStatus, $countryOfOrigin: CountryCode, $page: Int, $perpage: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perpage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(genre_in: $genres, format: $format, status: $status, countryOfOrigin: $countryOfOrigin, type: MANGA, sort: $sort) {
      id
      title { romaji english native }
      coverImage { large }
      bannerImage
      averageScore
      popularity
      chapters
      volumes
      format
      genres
      isAdult
      trending
      countryOfOrigin
    }
  }
}
`;

export const MANGA_STATS_QS = `
query ($id: Int) {
  Media(id: $id, type: MANGA) {
    id
    averageScore
    meanScore
    rankings {
      id
      rank
      type
      format
      year
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

export const MANGA_BATCH_INFO_QS = `
query ($ids: [Int]) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, type: MANGA) {
      id
      title { romaji english native }
      coverImage { large }
      chapters
      volumes
    }
  }
}
`;
