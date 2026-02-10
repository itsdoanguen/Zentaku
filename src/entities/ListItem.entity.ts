/**
 * List Item Entity
 */

import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { CustomList } from './CustomList.entity';
import { MediaItem } from './MediaItem.entity';
import { User } from './User.entity';

@Entity('list_items')
export class ListItem extends BaseEntity {
  @Column({ name: 'list_id', type: 'bigint' })
  @Index()
  listId!: bigint;

  @Column({ name: 'media_id', type: 'bigint' })
  @Index()
  mediaId!: bigint;

  @Column({ name: 'added_by_id', type: 'bigint' })
  addedById!: bigint;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex!: number;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('CustomList', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list!: CustomList;

  @ManyToOne('MediaItem', 'listItems', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media!: MediaItem;

  @ManyToOne('User', 'addedListItems')
  @JoinColumn({ name: 'added_by_id' })
  addedBy!: User;
}
