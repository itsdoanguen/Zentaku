/**
 * List Invitation Entity
 */

import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { CustomList } from './CustomList.entity';
import { InviteStatus, ListPermission } from './types/enums';
import { User } from './User.entity';

@Entity('list_invitations')
export class ListInvitation extends BaseEntity {
  @Column({ name: 'list_id', type: 'bigint' })
  @Index()
  listId!: bigint;

  @Column({ name: 'inviter_id', type: 'bigint' })
  inviterId!: bigint;

  @Column({ name: 'invitee_id', type: 'bigint' })
  @Index()
  inviteeId!: bigint;

  @Column({ type: 'enum', enum: ListPermission })
  permission!: ListPermission;

  @Column({ type: 'enum', enum: InviteStatus, default: InviteStatus.PENDING })
  status!: InviteStatus;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('CustomList', 'invitations', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list!: CustomList;

  @ManyToOne('User', 'listInvitesSent')
  @JoinColumn({ name: 'inviter_id' })
  inviter!: User;

  @ManyToOne('User', 'listInvitesReceived')
  @JoinColumn({ name: 'invitee_id' })
  invitee!: User;
}
