/**
 * Soft Deletable Entity
 *
 * Extends BaseEntity with soft delete functionality.
 * Adds a deletedAt timestamp that marks records as deleted
 * without physically removing them from the database.
 *
 * Use this for entities that need audit trail or recovery capability.
 */

import { DeleteDateColumn } from 'typeorm';
import { BaseEntity } from './BaseEntity';

export abstract class SoftDeletableEntity extends BaseEntity {
  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;
}
