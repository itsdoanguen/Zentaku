/**
 * Enum Types
 *
 * All enum definitions used across entities.
 */

export enum MediaType {
  ANIME = 'ANIME',
  MANGA = 'MANGA',
  NOVEL = 'NOVEL',
}

export enum MediaStatus {
  RELEASING = 'RELEASING',
  FINISHED = 'FINISHED',
  NOT_YET_RELEASED = 'NOT_YET_RELEASED',
  CANCELLED = 'CANCELLED',
}

export enum LibraryStatus {
  WATCHING = 'WATCHING',
  READING = 'READING',
  COMPLETED = 'COMPLETED',
  PLANNING = 'PLANNING',
  DROPPED = 'DROPPED',
  PAUSED = 'PAUSED',
}

export enum PrivacyMode {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  SHARED = 'SHARED',
}

export enum ChannelType {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  WATCH_PARTY = 'WATCH_PARTY',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

export enum RelationshipType {
  FOLLOW = 'FOLLOW',
  FRIEND = 'FRIEND',
  BLOCK = 'BLOCK',
}

export enum ListPermission {
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export enum AnimeSeason {
  WINTER = 'WINTER',
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL',
}
