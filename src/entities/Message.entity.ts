/**
 * Message Entity
 */

import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { Channel } from './Channel.entity';
import { User } from './User.entity';

@Entity('messages')
export class Message extends BaseEntity {
  @Column({ name: 'channel_id', type: 'bigint' })
  @Index()
  channelId!: bigint;

  @Column({ name: 'sender_id', type: 'bigint' })
  @Index()
  senderId!: bigint;

  @Column({ name: 'reply_to_id', type: 'bigint', nullable: true })
  replyToId?: bigint | null;

  @Column({ type: 'text', nullable: true })
  content?: string | null;

  @Column({ type: 'json', nullable: true })
  attachments?: Record<string, unknown>[] | null;

  @Column({ name: 'is_system_message', type: 'boolean', default: false })
  isSystemMessage!: boolean;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('Channel', 'messages', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel!: Channel;

  @ManyToOne('User', 'messages')
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @ManyToOne('Message', 'replies', { nullable: true })
  @JoinColumn({ name: 'reply_to_id' })
  replyTo?: Message | null;

  @OneToMany('Message', 'replyTo')
  replies!: Message[];
}
