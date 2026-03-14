import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import type { IAuthService } from '../services/auth.service';

class AuthController {
  constructor(private readonly authService: IAuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const result = await this.authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');
      const result = await this.authService.login(req.body, ipAddress, userAgent);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body as { token?: string };
      if (!token) {
        res.status(400).json({ message: 'Token is required' });
        return;
      }

      const result = await this.authService.verifyEmail(token);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  resendVerificationEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email } = req.body as { email?: string };
      if (!email) {
        res.status(400).json({ message: 'Email is required' });
        return;
      }

      const result = await this.authService.resendVerificationEmail(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  verifyEmailByLink = async (req: Request, res: Response): Promise<void> => {
    const token =
      typeof req.query.token === 'string' && req.query.token.trim() ? req.query.token : null;

    if (!token) {
      res.status(400).send(`
        <html>
          <head><title>Email Verification Failed</title></head>
          <body style="font-family: Arial, sans-serif; padding: 24px; color: #1f2937;">
            <h2>Email verification failed</h2>
            <p>Verification token is missing.</p>
          </body>
        </html>
      `);
      return;
    }

    try {
      const result = await this.authService.verifyEmail(token);
      res.status(200).send(`
        <html>
          <head><title>Email Verified</title></head>
          <body style="font-family: Arial, sans-serif; padding: 24px; color: #1f2937;">
            <h2>Email verified successfully</h2>
            <p>${result.message}</p>
          </body>
        </html>
      `);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid or expired verification token';
      res.status(400).send(`
        <html>
          <head><title>Email Verification Failed</title></head>
          <body style="font-family: Arial, sans-serif; padding: 24px; color: #1f2937;">
            <h2>Email verification failed</h2>
            <p>${message}</p>
          </body>
        </html>
      `);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email } = req.body as { email?: string };
      if (!email) {
        res.status(400).json({ message: 'Email is required' });
        return;
      }

      const result = await this.authService.forgotPassword(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { token, password } = req.body as { token?: string; password?: string };
      if (!token || !password) {
        res.status(400).json({ message: 'Token and password are required' });
        return;
      }

      const result = await this.authService.resetPassword(token, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cookieRefreshToken = (req as Request & { cookies?: { refreshToken?: string } }).cookies
        ?.refreshToken;
      const bodyRefreshToken = (req.body as { refreshToken?: string }).refreshToken;
      const refreshToken = cookieRefreshToken ?? bodyRefreshToken;

      if (!refreshToken) {
        res.status(401).json({ message: 'Refresh token required' });
        return;
      }

      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');
      const result = await this.authService.refreshToken(refreshToken, ipAddress, userAgent);

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cookieRefreshToken = (req as Request & { cookies?: { refreshToken?: string } }).cookies
        ?.refreshToken;
      const bodyRefreshToken = (req.body as { refreshToken?: string }).refreshToken;
      const refreshToken = cookieRefreshToken ?? bodyRefreshToken;
      const authHeader = req.headers.authorization;
      const accessToken =
        typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
          ? authHeader.substring(7)
          : undefined;
      const userId = req.user?.userId;

      if (refreshToken || accessToken) {
        await this.authService.logout(refreshToken, accessToken, userId);
      }

      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const user = await this.authService.getCurrentUser(userId);
      res.json(user);
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
