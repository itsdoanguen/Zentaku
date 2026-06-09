import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base/BaseEntity';
import { User } from './User.entity';

export enum TicketCategory {
  UI = 'UI',
  SERVER = 'SERVER',
  CONTENT = 'CONTENT',
  OTHER = 'OTHER',
}

export enum TicketStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

@Entity('support_tickets')
export class SupportTicket extends BaseEntity {
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: bigint;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: TicketCategory, default: TicketCategory.OTHER })
  category!: TicketCategory;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.PENDING })
  status!: TicketStatus;

  // ==================== RELATIONSHIPS ====================

  @ManyToOne('User', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
