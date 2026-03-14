import type { NextFunction, Request, Response } from 'express';
import { isAccessTokenRevoked } from '../modules/auth/utils/access-token-revocation.util';
import { TokenUtil } from '../modules/auth/utils/token.util';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization token required' });
      return;
    }

    const token = authHeader.substring(7);

    if (isAccessTokenRevoked(token)) {
      res.status(401).json({ message: 'Token has been revoked. Please login again.' });
      return;
    }

    try {
      const payload = TokenUtil.verifyAccessToken(token);
      req.user = payload;
      next();
    } catch {
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    next(error);
  }
};
