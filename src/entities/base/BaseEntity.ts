/**
 * Base Entity
 *
 * Abstract base class for all entities with standard fields:
 * - Auto-incrementing ID
 * - Created timestamp
 * - Updated timestamp
 *
 * All entities should extend this class for consistency.
 */

import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  BaseEntity as TypeORMBaseEntity,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity extends TypeORMBaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: bigint;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
