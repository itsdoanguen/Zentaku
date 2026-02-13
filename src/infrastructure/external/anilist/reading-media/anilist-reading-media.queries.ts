/**
 * AniList GraphQL Reading Media Query Definitions
 *
 * Supports both Manga and Novel formats through format filtering.
 * Uses AniList's type: MANGA for all reading media (as per AniList API design).
 */

export const READING_MEDIA_INFO_QS = `
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

export const READING_MEDIA_INFO_LIGHTWEIGHT_QS = `
query ($id: Int) {
  Media(id: $id, type: MANGA) {
    id
    title { romaji english native }
    coverImage { large }
    chapters
    volumes
    format
  }
}
`;

export const READING_MEDIA_COVERS_BATCH_QS = `
query ($ids: [Int]) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, type: MANGA) {
      id
      coverImage { large }
      format
    }
  }
}
`;

export const READING_MEDIA_ID_SEARCH_QS = `
query ($query: String, $page: Int, $perpage: Int, $format_in: [MediaFormat]) {
  Page (page: $page, perPage: $perpage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media (search: $query, type: MANGA, format_in: $format_in) {
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

export const READING_MEDIA_SEARCH_CRITERIA_QS = `
query ($genres: [String], $format_in: [MediaFormat], $status: MediaStatus, $countryOfOrigin: CountryCode, $page: Int, $perpage: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perpage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(genre_in: $genres, format_in: $format_in, status: $status, countryOfOrigin: $countryOfOrigin, type: MANGA, sort: $sort) {
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

export const READING_MEDIA_BATCH_INFO_QS = `
query ($ids: [Int]) {
  Page(page: 1, perPage: 50) {
    media(id_in: $ids, type: MANGA) {
      id
      title { romaji english native }
      coverImage { large }
      chapters
      volumes
      format
    }
  }
}
`;

// ========== Backward Compatibility Aliases ==========
// These maintain compatibility with existing code

export const MANGA_INFO_QS = READING_MEDIA_INFO_QS;
export const MANGA_INFO_LIGHTWEIGHT_QS = READING_MEDIA_INFO_LIGHTWEIGHT_QS;
export const MANGA_COVERS_BATCH_QS = READING_MEDIA_COVERS_BATCH_QS;
export const MANGA_ID_SEARCH_QS = READING_MEDIA_ID_SEARCH_QS;
export const MANGA_SEARCH_CRITERIA_QS = READING_MEDIA_SEARCH_CRITERIA_QS;
export const MANGA_BATCH_INFO_QS = READING_MEDIA_BATCH_INFO_QS;
