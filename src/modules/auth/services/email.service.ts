import type { Transporter } from 'nodemailer';
import nodemailer from 'nodemailer';
import logger from '../../../shared/utils/logger';
import { emailVerificationTemplate } from '../templates/email-verification.template';
import { passwordResetTemplate } from '../templates/password-reset.template';

export interface IEmailService {
  sendVerificationEmail(email: string, userName: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, userName: string, token: string): Promise<void>;
}

export class EmailService implements IEmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT ?? '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(email: string, userName: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.EMAIL_VERIFICATION_URL}?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify Your Email - MyAniList',
        html: emailVerificationTemplate(userName, verificationUrl),
      });
      logger.info(`Verification email sent to ${email}`);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, userName: string, token: string): Promise<void> {
    const resetUrl = `${process.env.PASSWORD_RESET_URL}?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Reset Your Password - MyAniList',
        html: passwordResetTemplate(userName, resetUrl),
      });
      logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
      logger.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}
