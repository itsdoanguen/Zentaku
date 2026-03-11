import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { SoftDeletableEntity } from './base/SoftDeletableEntity';
import type { User } from './User.entity';

@Entity('user_authentications')
export class UserAuthentication extends SoftDeletableEntity {
  @Column({ name: 'user_id', type: 'int', unique: true })
  userId!: number;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ name: 'email_verification_token', type: 'varchar', length: 255, nullable: true })
  emailVerificationToken?: string | null;

  @Column({ name: 'email_verification_expires', type: 'datetime', nullable: true })
  emailVerificationExpires?: Date | null;

  @Column({ name: 'password_reset_token', type: 'varchar', length: 255, nullable: true })
  passwordResetToken?: string | null;

  @Column({ name: 'password_reset_expires', type: 'datetime', nullable: true })
  passwordResetExpires?: Date | null;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt?: Date | null;

  @Column({ name: 'last_password_change', type: 'datetime', nullable: true })
  lastPasswordChange?: Date | null;

  // OAuth Support (for future)
  @Column({ name: 'oauth_provider', type: 'varchar', length: 50, nullable: true })
  oauthProvider?: string | null;

  @Column({ name: 'oauth_provider_id', type: 'varchar', length: 255, nullable: true })
  oauthProviderId?: string | null;

  // Security & Account Status
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'account_locked', type: 'boolean', default: false })
  accountLocked!: boolean;

  @Column({ name: 'failed_login_attempts', type: 'int', default: 0 })
  failedLoginAttempts!: number;

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil?: Date | null;

  // ==================== RELATIONSHIPS ====================

  @OneToOne('User', 'authentication', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
