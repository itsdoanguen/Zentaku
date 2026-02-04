/**
 * User Entity
 */

import { Column, Entity, OneToMany } from 'typeorm';
import type { Activity } from './Activity.entity';
import { SoftDeletableEntity } from './base/SoftDeletableEntity';
import type { ChannelParticipant } from './ChannelParticipant.entity';
import type { Comment } from './Comment.entity';
import type { Community } from './Community.entity';
import type { CommunityMember } from './CommunityMember.entity';
import type { CustomList } from './CustomList.entity';
import type { LibraryEntry } from './LibraryEntry.entity';
import type { ListInvitation } from './ListInvitation.entity';
import type { ListItem } from './ListItem.entity';
import type { Message } from './Message.entity';
import type { ProgressLog } from './ProgressLog.entity';
import type { UserRelationship } from './UserRelationship.entity';
import type { WatchRoomConfig } from './WatchRoomConfig.entity';

@Entity('users')
export class User extends SoftDeletableEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar?: string | null;

  @Column({ name: 'status_message', type: 'varchar', length: 500, nullable: true })
  statusMessage?: string | null;

  @Column({ type: 'json', nullable: true })
  settings?: Record<string, unknown> | null;

  // ==================== RELATIONSHIPS ====================

  @OneToMany('LibraryEntry', 'user')
  libraryEntries!: LibraryEntry[];

  @OneToMany('ProgressLog', 'user')
  progressLogs!: ProgressLog[];

  @OneToMany('CustomList', 'owner')
  ownedLists!: CustomList[];

  @OneToMany('ListInvitation', 'inviter')
  listInvitesSent!: ListInvitation[];

  @OneToMany('ListInvitation', 'invitee')
  listInvitesReceived!: ListInvitation[];

  @OneToMany('ListItem', 'addedBy')
  addedListItems!: ListItem[];

  @OneToMany('UserRelationship', 'follower')
  following!: UserRelationship[];

  @OneToMany('UserRelationship', 'following')
  followers!: UserRelationship[];

  @OneToMany('Community', 'owner')
  ownedCommunities!: Community[];

  @OneToMany('CommunityMember', 'user')
  joinedCommunities!: CommunityMember[];

  @OneToMany('ChannelParticipant', 'user')
  channelParticipants!: ChannelParticipant[];

  @OneToMany('Message', 'sender')
  messages!: Message[];

  @OneToMany('WatchRoomConfig', 'host')
  hostedRooms!: WatchRoomConfig[];

  @OneToMany('Activity', 'user')
  activities!: Activity[];

  @OneToMany('Comment', 'user')
  comments!: Comment[];
}
