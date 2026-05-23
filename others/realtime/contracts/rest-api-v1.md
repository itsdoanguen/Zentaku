# Realtime REST API Contract v1

## 1. Purpose

Define the REST API contract used by frontend and backend for community, channel, message, and watch-room flows.

This document is the single source of truth for:

1. Endpoint list
2. Request and response schemas
3. Pagination, filter, and sort behavior
4. REST error mapping aligned with realtime error codes
5. FE-ready payload examples

## 2. Scope

In scope:

1. Community endpoints
2. Channel endpoints
3. Message endpoints
4. Watch-room endpoints

Out of scope:

1. Non-MVP moderation workflow
2. Dedicated DM conversation model beyond private channel MVP

## 3. Global Conventions

Base path: /api

Global rules:

1. Auth required unless explicitly marked optional.
2. IDs are transported as string in response payloads.
3. Timestamps use ISO-8601 format.
4. Pagination defaults apply when query values are missing.
5. Error body must include code, message, requestId.

## 4. Community API

### 4.1 Endpoints

1. POST /api/communities
   - Auth: required
   - Purpose: create community
2. GET /api/communities
   - Auth: optional
   - Purpose: list communities with pagination and filters
   - Visibility policy: unauthenticated clients can only receive communities where isPublic is true; authenticated clients follow community visibility and membership policy.
3. GET /api/communities/:communityId
   - Auth: required for private community details
4. PATCH /api/communities/:communityId
   - Auth: required
   - Permission: owner or admin
5. POST /api/communities/:communityId/join
   - Auth: required
6. POST /api/communities/:communityId/leave
   - Auth: required
7. POST /api/communities/:communityId/invite-code
   - Auth: required
   - Permission: owner or moderator
8. POST /api/communities/join-by-code
   - Auth: required

### 4.2 Create Community Schema

Request body:

1. name: string, required, min 3, max 120
2. description: string, optional, max 2000
3. isPublic: boolean, optional, default true
4. icon: string, optional, nullable

Response body:

1. id: string
2. ownerId: string
3. name: string
4. description: string or null
5. isPublic: boolean
6. inviteCode: string or null
7. createdAt: ISO-8601
8. updatedAt: ISO-8601

### 4.3 List Communities Query Contract

Query params:

1. page: number, optional, default 1
2. perPage: number, optional, default 20, max 100
3. q: string, optional
4. isPublic: boolean, optional
5. sortBy: enum createdAt | membersCount | name, optional, default createdAt
6. sortOrder: enum asc | desc, optional, default desc

Response shape:

1. items: array
2. page: number
3. perPage: number
4. total: number
5. totalPages: number
6. hasNextPage: boolean
7. hasPreviousPage: boolean

## 5. Channel API

### 5.1 Endpoints

1. POST /api/communities/:communityId/channels
   - Auth: required
   - Permission: admin or moderator
2. GET /api/communities/:communityId/channels
   - Auth: required
3. POST /api/channels/private
   - Auth: required
   - Purpose: create or get one-to-one private channel
   - Request body: recipientId required
4. GET /api/channels/:channelId
   - Auth: required
   - Permission: participant only

### 5.4 Private Channel Rules (MVP)

1. Private channels are 1-to-1 direct message pairs between exactly two users.
2. The channel is created with recipientId and returns the existing channel if the pair already exists.
3. communityId must be null for private channels.
4. Private channels are not returned in public community channel lists.
5. Only the two participants may access the channel.
6. There is no group DM support in MVP.
7. Attachments remain out of scope for private channel creation and message upload pipelines.

### 5.2 Create Channel Schema

Request body:

1. name: string, required for TEXT channels
2. type: enum TEXT | WATCH_PARTY | VOICE, required
3. isPrivate: boolean, optional, default false
4. position: number, optional, default 0

Response body:

1. id: string
2. communityId: string or null
3. type: string
4. name: string or null
5. isPrivate: boolean
6. position: number

### 5.3 List Channels Query Contract

Query params:

1. includePrivate: boolean, optional, default false
2. sortBy: enum position | createdAt, optional, default position
3. sortOrder: enum asc | desc, optional, default asc

## 6. Message API

### 6.1 Endpoints

1. POST /api/channels/:channelId/messages
   - Auth: required
   - Permission: participant only
2. GET /api/channels/:channelId/messages
   - Auth: required
   - Permission: participant only
3. PATCH /api/channels/:channelId/read-cursor
   - Auth: required
   - Permission: participant only

### 6.2 Send Message Schema

Request body:

1. content: string, required, max 4000
2. replyToId: string, optional, nullable
3. attachments: array, optional, default empty array

Response body:

1. id: string
2. channelId: string
3. senderId: string
4. content: string
5. replyToId: string or null
6. attachments: array
7. createdAt: ISO-8601

### 6.3 Read Cursor Schema

Request body:

1. lastReadMessageId: string, required

Response body:

1. channelId: string
2. userId: string
3. lastReadMessageId: string
4. updatedAt: ISO-8601

### 6.4 Message History Query Contract

Query params:

1. cursor: string, optional
2. limit: number, optional, default 50, max 100
3. direction: enum backward | forward, optional, default backward
4. sortOrder: enum asc | desc, optional, default desc

Response shape:

1. items: array
2. nextCursor: string or null
3. hasMore: boolean

Note: Message history is served from the NoSQL message timeline (canonical store). Cursor encoding and pagination semantics are defined in the hybrid persistence contract: ./hybrid-persistence-contract-v1.md.

## 7. Watch-Room API

### 7.1 Endpoints

1. POST /api/watch-rooms
   - Auth: required
2. GET /api/watch-rooms
   - Auth: required
3. GET /api/watch-rooms/:channelId
   - Auth: required
   - Permission: participant only
4. PATCH /api/watch-rooms/:channelId
   - Auth: required
   - Permission: host or moderator
5. PATCH /api/watch-rooms/:channelId/host
   - Auth: required
   - Permission: current host or admin or moderator policy
6. PATCH /api/watch-rooms/:channelId/state
   - Auth: required
   - Permission: host or moderator
7. PATCH /api/watch-rooms/:channelId/queue
   - Auth: required
   - Permission: host or moderator
8. POST /api/watch-rooms/:channelId/join
   - Auth: required
9. POST /api/watch-rooms/:channelId/leave
   - Auth: required

### 7.2 Create Watch Room Schema

Request body:

1. channelId: string, required
2. mediaId: string, optional, nullable
3. currentSourceUrl: string, optional, nullable
4. settings: object, optional

Response body:

1. channelId: string
2. hostId: string
3. mediaId: string or null
4. isPlaying: boolean
5. currentTimestamp: number
6. currentSourceUrl: string or null
7. playlistQueue: array
8. lastSyncedAt: ISO-8601

### 7.3 Transfer Host Schema

Request body:

1. targetUserId: string, required

Response body:

1. channelId: string
2. previousHostId: string
3. hostId: string
4. updatedAt: ISO-8601

### 7.4 Update Playback State Schema

Request body:

1. action: enum play | pause | seek, required
2. timestamp: number, required for seek, optional for play and pause

Response body:

1. channelId: string
2. hostId: string
3. isPlaying: boolean
4. currentTimestamp: number
5. lastSyncedAt: ISO-8601

### 7.5 Update Queue Schema

Request body:

1. playlistQueue: array, required

Response body:

1. channelId: string
2. playlistQueue: array
3. updatedAt: ISO-8601

### 7.6 List Watch Rooms Query Contract

Query params:

1. page: number, optional, default 1
2. perPage: number, optional, default 20, max 100
3. q: string, optional
4. isPlaying: boolean, optional
5. hostId: string, optional
6. sortBy: enum lastSyncedAt | createdAt | participantsCount, optional, default lastSyncedAt
7. sortOrder: enum asc | desc, optional, default desc

Response shape:

1. items: array
2. page: number
3. perPage: number
4. total: number
5. totalPages: number
6. hasNextPage: boolean
7. hasPreviousPage: boolean

## 8. Error Response Mapping

Use the same logical error family from contracts/error-codes-v1.md.

1. AUTH_REQUIRED, AUTH_INVALID, AUTH_EXPIRED -> REST 401
2. PERMISSION_DENIED, ROOM_ACCESS_DENIED, HOST_REQUIRED -> REST 403
3. ROOM_NOT_FOUND, MESSAGE_NOT_FOUND -> REST 404
4. SNAPSHOT_UNAVAILABLE -> REST 503
5. PAYLOAD_INVALID, REQUEST_ID_INVALID -> REST 400
6. RATE_LIMITED -> REST 429
7. STATE_CONFLICT -> REST 409
8. INTERNAL_ERROR, DEPENDENCY_UNAVAILABLE -> REST 500

Standard REST error body:

1. code: string
2. message: string
3. requestId: string
4. details: object optional

## 9. FE-Ready Payload Examples

### 9.1 Create Community

Request:

1. name: Anime Club
2. description: Community for seasonal anime discussions
3. isPublic: true

Response:

1. id: 901
2. ownerId: 12
3. name: Anime Club
4. inviteCode: ANIMECLUB01

### 9.2 Send Message

Request:

1. content: Anyone watching episode 3 tonight?
2. replyToId: null

Response:

1. id: 11045
2. channelId: 223
3. senderId: 12
4. createdAt: 2026-04-11T08:35:20.000Z

### 9.3 Create Watch Room

Request:

1. channelId: 223
2. mediaId: 4871
3. currentSourceUrl: https://cdn.example.com/stream/ep3.m3u8

Response:

1. channelId: 223
2. hostId: 12
3. isPlaying: false
4. currentTimestamp: 0

### 9.4 Seek via REST Fallback

Request:

1. action: seek
2. timestamp: 1520.4

Response:

1. channelId: 223
2. isPlaying: true
3. currentTimestamp: 1520.4
4. lastSyncedAt: 2026-04-11T08:45:00.000Z
