import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { ITokenPayload } from '../types/auth.types';

export class TokenUtil {
  private static readonly JWT_SECRET = process.env.JWT_SECRET;
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
  private static readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

  static generateAccessToken(payload: ITokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  static generateRefreshToken(payload: ITokenPayload): string {
    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
  }

  static verifyAccessToken(token: string): ITokenPayload {
    return jwt.verify(token, this.JWT_SECRET) as ITokenPayload;
  }

  static verifyRefreshToken(token: string): ITokenPayload {
    return jwt.verify(token, this.JWT_REFRESH_SECRET) as ITokenPayload;
  }

  static generateRandomToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  static getAccessTokenExpiresIn(): number {
    const match = this.JWT_EXPIRES_IN.match(/^(\d+)([smhd])$/);
    if (!match) return 900;

    const [, rawValue, unit] = match;
    const value = parseInt(rawValue ?? '0', 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }

  static getRefreshTokenExpiresAt(): Date {
    const match = this.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [, rawValue, unit] = match;
    const value = parseInt(rawValue ?? '0', 10);

    let milliseconds = 0;
    switch (unit) {
      case 's':
        milliseconds = value * 1000;
        break;
      case 'm':
        milliseconds = value * 60 * 1000;
        break;
      case 'h':
        milliseconds = value * 3600 * 1000;
        break;
      case 'd':
        milliseconds = value * 86400 * 1000;
        break;
    }

    return new Date(Date.now() + milliseconds);
  }
}
