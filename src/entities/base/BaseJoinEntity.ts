/**
 * Base Join Entity
 *
 * Abstract base class for many-to-many join tables.
 * Only includes creation timestamp (no ID or update timestamp).
 *
 * Use this for relationship/junction tables like:
 * - UserRelationship
 * - CommunityMember
 * - ChannelParticipant
 */

import { CreateDateColumn, BaseEntity as TypeORMBaseEntity } from 'typeorm';

export abstract class BaseJoinEntity extends TypeORMBaseEntity {
  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;
}
