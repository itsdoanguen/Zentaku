# Realtime Platform Master Plan

## EX. ABOUT THE COMMENT ON THE CODE

MUST REMEMBER TO NOT EXPLAIN EVERYTHING BY COMMENT, ONLY EXPLAIN FOR COMPLEX THINGS
LET THE CODE EXPLAIN IT SELF, THE NAME AND OTHERS.

## 1. Executive Summary

Muc tieu la xay dung nen tang realtime dung chung cho 2 nhom tinh nang:

- Community and chat (uu tien trien khai truoc)
- Watch party (trien khai sau, tai su dung toan bo foundation)

Nguyen tac trien khai:

- Shared realtime foundation truoc
- Community and chat sau do
- Watch party cuoi cung

Ly do:

- Community and chat co do phuc tap business thap hon dong bo playback
- Co the tan dung ngay model du lieu hien co: Community, Channel, Message, ChannelParticipant, CommunityMember
- Phu hop de tan dung mot so entity hien co cho identity va quan he (Community, Channel, ChannelParticipant, CommunityMember), tuy nhien chat history se su dung mo hinh hybrid: MySQL giu identity va relational metadata, NoSQL (document store) giu canonical message history.
- Watch party se tro thanh bien the cua Channel voi trang thai playback duoc quan ly boi WatchRoomConfig

## 2. Scope

### 2.1 In Scope

- Realtime transport cho backend
- Event contract chuan hoa cho chat va watch party
- Authentication and authorization cho realtime connection
- Community and chat API plus realtime events
- Watch party API plus realtime sync events
- Test strategy khong phu thuoc FE
- Tai lieu integration cho FE

### 2.2 Out of Scope cho MVP

- Message reactions
- Message pinning
- Full-text search cho chat
- File upload pipeline rieng cho chat attachments
- Advanced moderation workflow (audit log day du, report pipeline day du)
- Multi-region realtime distribution

## 3. Current State Assessment

### 3.1 Strengths

- Entity model da co san va kha day du cho community and room chat
- Co WatchRoomConfig de luu playback state
- Kien truc backend dang theo pattern module ro rang:
  - repository
  - service
  - controller
  - routes
  - loader DI

### 3.2 Gaps

- Chua co websocket transport
- Chua co module realtime dung nghia
- Chua co event naming convention va payload contract chinh thuc
- Chua co flow authorization theo room cho socket events

## 4. Target Architecture

## 4.1 Layering

- REST layer:
  - CRUD data, truy van lich su, fallback polling
- Realtime layer:
  - Connection lifecycle
  - Event publish and subscribe
  - Presence and typing
  - Playback sync events
- Service layer:
  - Business rules
  - Permission checks
  - State transitions
- Repository layer:
  - Persistence

### 4.2 Room Abstraction

Dung chung room abstraction dua tren Channel:

- Community text channel
- Private channel (co the dung cho DM trong MVP)
- Watch party channel

### 4.3 Authorization Model

- Connection auth: token based
- Event auth: moi event deu check room membership and role
- Playback authority:
  - Host or moderator moi duoc dieu khien playback state

## 5. Delivery Roadmap

## Phase 0 - Design and Contracts

Duration: 3 to 5 ngay

Deliverables:

- Realtime event taxonomy and naming standard
- Payload schema draft cho client to server va server to client
- Error code matrix cho realtime
- Security checklist cho connection va event authorization

Acceptance Criteria:

- Team BE and FE thong nhat event names, payload shape, ack format
- Co tai lieu versioned cho contract

## Phase 1 - Shared Realtime Foundation

Duration: 1 to 2 tuan

Muc tieu:

- Dua websocket vao backend va tuan thu DI pattern hien co

Cong viec chinh:

- Them dependency realtime transport
- Gan realtime server vao bootstrap HTTP
- Tao realtime module and loader
- Xay auth middleware cho socket
- Xay room join and leave flow dung chung
- Xay event gateway and dispatcher co logging and tracing

Deliverables:

- Realtime server chay on top of existing app lifecycle
- Standard event envelope:
  - event
  - version
  - requestId
  - data
  - error
- Co metrics and logs co request correlation

Acceptance Criteria:

- 2 clients co the connect, auth, join room, receive broadcast
- Khong anh huong cac REST APIs hien tai

## Phase 2 - Community and Chat First Release

Duration: 2 to 3 tuan

Muc tieu:

- Release chat and community MVP tren foundation da co

Cong viec chinh:

- Community APIs:
  - create, update, delete, list, get details
  - join, leave, invite code flow
- Channel APIs:
  - create text channel
  - private channel
  - list channels by community
- Message APIs:
  - create message
  - list message history with pagination
  - reply thread base support
- Realtime events:
  - message.created
  - message.updated optional for MVP
  - message.deleted optional for MVP
  - typing.started and typing.stopped
  - presence.joined and presence.left
  - read.cursor.updated

Deliverables:

- Community and chat MVP hoat dong voi persistence and realtime
- FE integration guide cho chat lifecycle

Acceptance Criteria:

- User co the tao community, join channel, nhan tin realtime
- Read marker and basic presence hoat dong
- Unauthorized user khong the join or publish vao room khong co quyen

## Phase 3 - Watch Party MVP

Duration: 2 tuan

Muc tieu:

- Dung lai room and chat layer, bo sung playback synchronization

Cong viec chinh:

- Watch room APIs:
  - create and configure room
  - attach media and source
  - set host and transfer host
- Playback events:
  - playback.play
  - playback.pause
  - playback.seek
  - playback.sync
  - queue.update
- State persistence:
  - isPlaying
  - currentTimestamp
  - currentSourceUrl
  - playlistQueue
  - lastSyncedAt
- Authority and anti-conflict:
  - chi host or role hop le moi duoc control
  - server serializes state updates

Deliverables:

- Watch party MVP voi dong bo co ban va room chat

Acceptance Criteria:

- Nhieu user trong cung room thay doi playback state dong bo
- New joiner co the nhan state snapshot va bat kip room

## Phase 4 - Hardening and Go-Live Readiness

Duration: 1 tuan

Cong viec chinh:

- Performance test and load test
- Reconnect and retry strategy
- Edge case handling
- Observability completion
- Security audit checklist closure

Acceptance Criteria:

- Dat SLO cho latency event va ty le failed emits
- Khong co loi nghiem trong tren flow auth, join, message, playback

## 6. Proposed Event Contract

## 6.1 Envelope

- event: string
- version: string
- requestId: string
- timestamp: number
- data: object optional
- error: object optional

## 6.2 Core Events

Foundation:

- connection.ready
- room.join
- room.leave
- room.snapshot
- error

Community and chat:

- message.send
- message.created
- message.history.request
- message.history.response
- typing.started
- typing.stopped
- presence.joined
- presence.left
- read.cursor.update

Watch party:

- watch.snapshot
- playback.play
- playback.pause
- playback.seek
- playback.state.changed
- queue.update

## 7. Data and Domain Rules

- Channel la primitive room dung chung
- CommunityMember la quyen cap community level
- ChannelParticipant la quyen cap channel level
- Message luu lich su chat cho tat ca room types
- Message: canonical chat history is stored in a NoSQL document store; relational sidecars (e.g., lastMessageId, counters) remain in MySQL.
- WatchRoomConfig luu playback state cho channel type WATCH_PARTY

Domain constraints:

- Moi event gui vao room phai check membership
- Event control playback phai check host or moderator
- Message size and rate limit can duoc enforce o gateway

## 8. Testing Strategy Without FE

## 8.1 Unit Tests

- Service methods cho authorization va state transitions
- Message and room validation logic

## 8.2 Integration Tests

- Repository persistence tests
- REST plus realtime mixed tests
- Simulate 2 to 3 clients ket noi websocket

## 8.3 Contract Tests

- Validate payload schema against event contract
- Ensure backwards compatibility theo version

## 8.4 End to End Backend-Only Harness

- Script A: user1 connect and join room
- Script B: user2 connect and join room
- Script A send message, Script B verify receive
- Script A trigger playback.seek, Script B verify state changed

## 9. FE Collaboration Plan

FE can bo sung sau ma BE van test duoc:

- BE cung cap event catalog and payload examples
- BE cung cap Postman and websocket script samples
- FE implement theo lifecycle:
  - connect
  - auth
  - join room
  - subscribe events
  - emit user actions

Milestone sync voi FE:

- M1 sau Phase 1: FE nhan duoc foundation SDK notes
- M2 sau Phase 2: FE chat UI integration
- M3 sau Phase 3: FE watch party controls integration

## 10. Security and Reliability Checklist

Security:

- Token verification on connect
- Membership check on every room event
- Role check cho privileged events
- Basic rate limiting cho message and playback control events

Reliability:

- Idempotency cho cac events critical
- Reconnect with state resync
- Dead connection cleanup
- Structured logs with requestId

## 11. Risks and Mitigations

Risk 1:
Realtime transport implementation anh huong startup lifecycle
Mitigation:

- Tich hop theo tung buoc va test smoke sau moi buoc

Risk 2:
Event contract thay doi giua BE and FE
Mitigation:

- Version hoa contract and freeze theo milestone

Risk 3:
Race condition trong playback sync
Mitigation:

- Server authority model and serialized updates

Risk 4:
DM model chua ro giua private channel va conversation rieng
Mitigation:

- Chot private channel cho MVP, re-evaluate sau khi release

## 12. Timeline Overview

- Week 1: Phase 0 plus Phase 1 start
- Week 2: Complete Phase 1
- Week 3 to 4: Phase 2 community and chat MVP
- Week 5 to 6: Phase 3 watch party MVP
- Week 7: Phase 4 hardening and go-live readiness

Tong du kien: 6 to 7 tuan cho MVP day du ca 2 nhom tinh nang

## 13. Milestone Exit Criteria

M1 Foundation Ready:

- Realtime auth, join, leave, broadcast da on dinh

M2 Community Chat Ready:

- Community and channel and message flow da hoat dong realtime

M3 Watch Party Ready:

- Playback sync, host control, state snapshot da on dinh

M4 Production Ready:

- Performance and reliability and security checklist dat yeu cau

## 14. Implementation Notes for This Repository

Can bám pattern hien co:

- Loader registration o src/config/loaders
- Dependency registration o src/config/container.ts
- Route aggregation o src/routes/index.ts
- HTTP bootstrap o src/server.ts
- Service and repository architecture theo module pattern dang dung

Khuyen nghi thuc thi:

- Tao module realtime rieng de khong lam ban architect hien tai
- Community and watch party modules tiep tuc theo controller and service and repository structure giong follow and streaming

## 15. Definition of Done

Tinh nang duoc xem la done khi:

- Da co tests o muc unit and integration cho cac flow chinh
- Da co tai lieu event contract cho FE
- Da verify backend-only realtime test harness
- Da pass type-check and build
- Da co log and metrics co the truy vet su co tren production
