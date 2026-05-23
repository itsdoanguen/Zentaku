# Realtime Event Catalog v1

## 1. Purpose

Define all v1 realtime events with payload contracts.

## 1.1 Ordering and Delivery Guarantees

1. Room-scoped broadcasts are serialized by the server to preserve FIFO ordering within each room.
2. Events on the same socket connection are processed in the order they are received.
3. playback.play, playback.pause, playback.seek, and queue.update must be applied in room order after server-side validation.
4. typing.started and read.cursor.update may be dropped under backpressure.
5. playback.sync is telemetry only and must not mutate authoritative playback state.

## 2. Foundation Events

## 2.1 connection.ready (server -> client)

```json
{
  "sessionId": "string",
  "userId": "string",
  "capabilities": ["chat", "watch-party"]
}
```

## 2.2 room.join (client -> server)

```json
{
  "channelId": "string"
}
```

## 2.3 room.leave (client -> server)

```json
{
  "channelId": "string",
  "reason": "string-optional"
}
```

## 2.4 room.snapshot (server -> client)

```json
{
  "channelId": "string",
  "channelType": "TEXT|WATCH_PARTY|VOICE",
  "participants": [
    {
      "userId": "string",
      "displayName": "string"
    }
  ],
  "lastMessageId": "string-optional",
  "serverTime": 1712736000000
}
```

## 3. Chat Events

## 3.1 message.send (client -> server)

```json
{
  "channelId": "string",
  "content": "string",
  "replyToId": "string-optional",
  "attachments": []
}
```

Attachments are reserved for future support in MVP and must be treated as an empty array.

## 3.2 message.created (server -> room)

```json
{
  "messageId": "string",
  "channelId": "string",
  "senderId": "string",
  "content": "string",
  "replyToId": "string-optional",
  "createdAt": "ISO-8601"
}
```

## 3.3 message.history.request (client -> server)

```json
{
  "channelId": "string",
  "cursor": "string-optional",
  "limit": 50
}
```

## 3.4 message.history.response (server -> client)

```json
{
  "channelId": "string",
  "items": [],
  "nextCursor": "string-optional",
  "hasMore": true
}
```

## 3.5 typing.started and typing.stopped (client -> server, server -> room)

```json
{
  "channelId": "string"
}
```

## 3.6 presence.joined and presence.left (server -> room)

```json
{
  "channelId": "string",
  "userId": "string",
  "displayName": "string"
}
```

## 3.7 read.cursor.update (client -> server)

```json
{
  "channelId": "string",
  "lastReadMessageId": "string"
}
```

## 3.8 read.cursor.updated (server -> client)

```json
{
  "channelId": "string",
  "userId": "string",
  "lastReadMessageId": "string",
  "updatedAt": "ISO-8601"
}
```

## 4. Watch Party Events

## 4.1 watch.snapshot (server -> client)

```json
{
  "channelId": "string",
  "hostId": "string",
  "isPlaying": true,
  "currentTimestamp": 120.5,
  "currentSourceUrl": "string-optional",
  "playlistQueue": [],
  "participants": [
    {
      "userId": "string",
      "displayName": "string",
      "role": "host|member"
    }
  ],
  "lastSyncedAt": "ISO-8601"
}
```

## 4.2 playback.play and playback.pause (client -> server)

```json
{
  "channelId": "string",
  "atTimestamp": 120.5
}
```

## 4.3 playback.seek (client -> server)

```json
{
  "channelId": "string",
  "toTimestamp": 220.25
}
```

## 4.4 playback.sync (client -> server)

```json
{
  "channelId": "string",
  "clientTimestamp": 220.25,
  "clientSentAt": 1712736000000
}
```

Server behavior:

1. Record drift and latency telemetry only.
2. Do not change authoritative playback state.
3. Do not broadcast playback.state.changed in response to playback.sync.
4. If drift exceeds the server threshold, the client should request watch.snapshot again.

## 4.5 queue.update (client -> server, server -> room after persistence)

```json
{
  "channelId": "string",
  "playlistQueue": []
}
```

## 4.6 playback.state.changed (server -> room)

```json
{
  "channelId": "string",
  "hostId": "string",
  "isPlaying": true,
  "currentTimestamp": 220.25,
  "currentSourceUrl": "string-optional",
  "playlistQueue": [],
  "lastSyncedAt": "ISO-8601"
}
```

## 5. Payload Constraints

1. channelId and userId are serialized as strings for transport safety.
2. content max length: 4000 characters.
3. limit max for history request: 100.
4. typing events are rate-limited by flow-control-v1.md.
