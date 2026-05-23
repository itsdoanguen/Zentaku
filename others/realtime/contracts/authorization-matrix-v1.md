# Realtime Authorization Matrix v1

## 1. Role Model

Role source order:

1. Community role from CommunityMember.
2. Channel membership from ChannelParticipant.
3. Watch-room host from WatchRoomConfig.hostId.

Roles used in matrix:

1. ADMIN
2. MODERATOR
3. MEMBER
4. NON_MEMBER

## 2. Event Authorization Matrix

| Event                   | ADMIN | MODERATOR | MEMBER           | NON_MEMBER |
| ----------------------- | ----- | --------- | ---------------- | ---------- |
| room.join               | Allow | Allow     | Allow            | Deny       |
| room.leave              | Allow | Allow     | Allow            | Deny       |
| message.send            | Allow | Allow     | Allow            | Deny       |
| message.history.request | Allow | Allow     | Allow            | Deny       |
| typing.started          | Allow | Allow     | Allow            | Deny       |
| typing.stopped          | Allow | Allow     | Allow            | Deny       |
| read.cursor.update      | Allow | Allow     | Allow            | Deny       |
| playback.play           | Allow | Allow     | Deny unless host | Deny       |
| playback.pause          | Allow | Allow     | Deny unless host | Deny       |
| playback.seek           | Allow | Allow     | Deny unless host | Deny       |
| playback.sync           | Allow | Allow     | Allow            | Deny       |
| queue.update            | Allow | Allow     | Deny unless host | Deny       |

## 3. Additional Policy Rules

1. Non-members are denied before payload processing.
2. Member who is current room host can perform host-only controls.
3. Moderator host-transfer behavior is governed by watch-party service policy.
4. Permission checks happen at event handling time, not only during room.join.
5. Private channels are 1-to-1 channels and must cap membership at exactly two participants.
6. Private channel access still uses ChannelParticipant checks and communityId must remain null.

## 4. Audit Expectations

For denied events, log:

1. requestId
2. event
3. actor userId
4. target channelId
5. error code
