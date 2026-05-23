# Hybrid Persistence Contract v1

## Purpose

Define the storage boundary and canonical persistence semantics for realtime chat: relational DB (MySQL) retains identity and relational metadata; a NoSQL document store retains message history and other high-write chat datasets.

## Ownership

- MySQL (relational): community, channel, user identity, membership/channel participant records, watch-room configuration metadata, and any strongly relational joins.
- NoSQL (document store): canonical message history documents, message attachments metadata (if large or high-write), and optional high-write cursors/presence if justified by access patterns.

## Message Document Shape (example)

{
"id": "string", # message id (UUID)
"channelId": "string",
"senderId": "string",
"content": "string",
"replyToId": "string|null",
"attachments": [ ... ],
"createdAt": "ISO-8601",
"editedAt": "ISO-8601|null",
"meta": {"searchKeywords": [...]} # optional denormalized fields
}

## Relational Sidecar Data

- The relational DB stores message references and light sidecar metadata only when necessary for joins, e.g. `lastMessageId` on Channel, message counters, unread counters, or denormalized sender display name for fast lists.
- Avoid duplicating full message content in MySQL; prefer references (messageId) and small indexed fields.

## Cursor & Pagination

- Cursor encoding must be opaque to clients and encode ordering and shard key if needed (e.g., base64 of `{createdAt, id}`).
- Support both backward and forward pagination. Next cursor value points into the NoSQL timeline.
- Pagination semantics must be documented in `contracts/rest-api-v1.md` and FE examples updated to use cursor-based flows.

## Idempotency & Ordering

- Message creation must be idempotent by `requestId` for publish and REST write paths.
- Writes to both stores must be coordinated via repository abstractions. Prefer write-through to NoSQL first, then best-effort relational updates for sidecars, with reconciliation jobs or compensating transactions if needed.
- Ordering guarantees: per-channel causal ordering is recommended; document expected consistency level (eventual for cross-region, strongly consistent within single partition).

## Indexing & TTL

- NoSQL indexes: (`channelId`, `createdAt`), and `channelId` + custom fields used for queries (e.g., `replyToId`).
- TTL: optional short-term TTL for ephemeral channels or system-retention policies; long-term archives should be handled by separate retention/export jobs.

## Read Patterns & Caching

- Reads for message history should be served primarily from NoSQL. Use MySQL only for identity/permission lookups and channel-sidecar reads.
- Presence, typing, and read-cursor may be implemented as cache-backed transient stores (Redis) or in NoSQL only if access pattern justifies high-write durability.

## Consistency & Failure Modes

- Define reconciliation flows for eventual consistency: background jobs to repair missing sidecar links, counters, and lastMessageId.
- Document acceptable staleness windows for FE and introduce compensating UI behaviors when history lags behind realtime delivery.

## Governance

- Phase 0 freeze must include this contract file as part of the contract pack.
- Any change to ownership, document shape, or pagination semantics requires a `PLAN-CONTRACT` change and cross-team sign-off.

## Implementation Notes

- Provide a repository abstraction in code: `MessageRepository` with methods for `appendMessage`, `fetchHistory(cursor, limit)`, `updateReadCursor`, and `reconcileSidecars`.
- Prefer provider-agnostic APIs in this contract; do not lock a vendor until Phase 0 decides on a candidate store.

## Example FE Guidance

- Clients should use cursor-based pagination from the NoSQL timeline and perform permission checks via REST lookups to MySQL when necessary.
