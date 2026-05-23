# Phase 2 Technical Plan: Community and Chat MVP

## EX. ABOUT THE COMMENT ON THE CODE

MUST REMEMBER TO NOT EXPLAIN EVERYTHING BY COMMENT, ONLY EXPLAIN FOR COMPLEX THINGS
LET THE CODE EXPLAIN IT SELF, THE NAME AND OTHERS.

## 1. Objective

Deliver community and chat MVP on top of the shared realtime foundation.

## 2. Private Channel MVP Rules

1. Private channels are 1-to-1 direct message pairs between exactly two users.
2. The create-or-get API takes recipientId and returns the existing private channel if the pair already exists.
3. communityId is null for private channels.
4. Only the two participants may access the channel.
5. There is no group DM support in MVP.
6. Attachments are reserved and must stay empty in MVP.

## 6.1 RESTful API Contract Source

Phase 2 REST contract is centralized in:

1. contracts/rest-api-v1.md section 4 for Community API.
2. contracts/rest-api-v1.md section 5 for Channel API.
3. contracts/rest-api-v1.md section 6 for Message API.
4. contracts/rest-api-v1.md section 8 for error mapping.
5. contracts/rest-api-v1.md section 9 for FE-ready examples.
   Response body:

6. id: string
7. communityId: string or null
8. type: string
9. name: string or null
10. isPrivate: boolean
11. position: number

### Send Message

Request body:

1. content: string, required, max 4000
2. replyToId: string, optional, nullable
3. attachments: array, optional, default empty array, MVP keeps this empty and does not implement an upload pipeline

Response body:

1. id: string
2. channelId: string
3. senderId: string
4. content: string
5. replyToId: string or null
6. attachments: array
7. createdAt: ISO-8601

### Update Read Cursor

Request body:

1. lastReadMessageId: string, required

Response body:

1. channelId: string
2. userId: string
3. lastReadMessageId: string
4. updatedAt: ISO-8601

## 6.3 Pagination, Filter, and Sort Contract

### GET /api/communities

Query params:

1. page: number, optional, default 1
2. perPage: number, optional, default 20, max 100
3. q: string, optional, name search keyword
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

### GET /api/communities/:communityId/channels

Query params:

1. includePrivate: boolean, optional, default false
2. sortBy: enum position | createdAt, optional, default position
3. sortOrder: enum asc | desc, optional, default asc

### GET /api/channels/:channelId/messages

Query params:

1. cursor: string, optional
2. limit: number, optional, default 50, max 100
3. direction: enum backward | forward, optional, default backward
4. sortOrder: enum asc | desc, optional, default desc

Response shape:

1. items: array
2. nextCursor: string or null
3. hasMore: boolean

## 6.4 Error Response Mapping (REST and Realtime Parity)

Use the same logical error family from contracts/error-codes-v1.md.

1. AUTH_REQUIRED, AUTH_INVALID, AUTH_EXPIRED -> REST 401
2. PERMISSION_DENIED, ROOM_ACCESS_DENIED -> REST 403
3. ROOM_NOT_FOUND, MESSAGE_NOT_FOUND -> REST 404
4. PAYLOAD_INVALID, REQUEST_ID_INVALID -> REST 400
5. RATE_LIMITED -> REST 429
6. INTERNAL_ERROR, DEPENDENCY_UNAVAILABLE -> REST 500

Standard REST error body:

1. code: string
2. message: string
3. requestId: string
4. details: object optional

## 6.5 FE-Ready Payload Examples

### Example: Create Community

Request:

1. name: Anime Club
2. description: Community for seasonal anime discussions
3. isPublic: true

Response:

1. id: 901
2. ownerId: 12
3. name: Anime Club
4. inviteCode: ANIMECLUB01

### Example: Send Message

Request:

1. content: Anyone watching episode 3 tonight?
2. replyToId: null

Response:

1. id: 11045
2. channelId: 223
3. senderId: 12
4. createdAt: 2026-04-11T08:35:20.000Z

## 7. Test Strategy

Unit tests:

1. Community role checks.
2. Channel participant checks.
3. Message validation and reply integrity.

Integration tests:

1. Community create and join flows.
2. Channel create and list flows.
3. Message persistence and history pagination.
4. Realtime message delivery to subscribed room members.
5. Unauthorized publish and subscribe rejection.

Contract tests:

1. Chat event payload schema checks.
2. Error payload schema checks.

## 8. Risks and Mitigation

Risk 1: Permission drift between REST and realtime paths.
Mitigation: Route both through service-level policy methods.

Risk 2: High write amplification from read cursor updates.
Mitigation: Debounce and apply idempotent update semantics.

Risk 3: Private channel semantics unclear for DM.
Mitigation: Private channel rules are defined above and group DM is deferred.

## 9. Exit Criteria

1. User can create community, join channel, and chat in realtime.
2. Message history is persisted in a NoSQL document store and paginated via opaque cursor semantics; relational DB holds identity and sidecar metadata.
3. Read cursor updates are persisted correctly.
4. Private channel access is limited to exactly two participants.
5. Unauthorized users cannot subscribe or publish in protected rooms.
