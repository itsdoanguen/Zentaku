import express, { type Router } from 'express';
import type { Container } from '../../config/container';
import { authenticate } from '../../middlewares/authenticate';
import type AuthController from './controllers/auth.controller';
import {
  forgotPasswordValidation,
  loginValidation,
  registerValidation,
  resendVerificationEmailValidation,
  resetPasswordValidation,
} from './validators/auth.validators';

const initializeAuthRoutes = (container: Container): Router => {
  const router = express.Router();
  const authController = container.resolve<AuthController>('authController');

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register a new user
   *     description: Create a new account with username, email, and password, then send an email verification token.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [username, email, password, confirmPassword]
   *             properties:
   *               username:
   *                 type: string
   *                 minLength: 3
   *                 maxLength: 50
   *                 example: testuser
   *               email:
   *                 type: string
   *                 format: email
   *                 example: test@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: Test@1234
   *               confirmPassword:
   *                 type: string
   *                 format: password
   *                 example: Test@1234
   *               displayName:
   *                 type: string
   *                 example: Test User
   *     responses:
   *       201:
   *         description: Registration successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     email:
   *                       type: string
   *                     username:
   *                       type: string
   *                     emailVerified:
   *                       type: boolean
   *                     roles:
   *                       type: array
   *                       items:
   *                         type: string
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation error
   *       409:
   *         description: Email or username already exists
   */
  router.post('/register', registerValidation, authController.register);

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login user
   *     description: Authenticate user credentials and return an access token while setting refresh token in HTTP-only cookie.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: test@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: Test@1234
   *               rememberMe:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                 expiresIn:
   *                   type: integer
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: integer
   *                     email:
   *                       type: string
   *                     username:
   *                       type: string
   *                     emailVerified:
   *                       type: boolean
   *                     roles:
   *                       type: array
   *                       items:
   *                         type: string
   *       400:
   *         description: Validation error
   *       401:
   *         description: Invalid credentials or unverified account
   */
  router.post('/login', loginValidation, authController.login);

  /**
   * @swagger
   * /api/auth/verify-email:
   *   get:
   *     summary: Verify email address via link
   *     description: Verify user email from clickable backend link in email.
   *     tags: [Auth]
   *     parameters:
   *       - in: query
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *         description: Email verification token.
   *     responses:
   *       200:
   *         description: Email verified page
   *       400:
   *         description: Invalid or expired verification token
   */
  router.get('/verify-email', authController.verifyEmailByLink);

  /**
   * @swagger
   * /api/auth/verify-email:
   *   post:
   *     summary: Verify email address
   *     description: Verify user email using the verification token sent by email during registration.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [token]
   *             properties:
   *               token:
   *                 type: string
   *                 example: 4f3a9ef5d2b9f6f0c2a2d5a338f1ab9f
   *     responses:
   *       200:
   *         description: Email verified
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Missing token or invalid token payload
   *       401:
   *         description: Invalid or expired verification token
   */
  router.post('/verify-email', authController.verifyEmail);

  /**
   * @swagger
   * /api/auth/resend-verification-email:
   *   post:
   *     summary: Resend verification email
   *     description: Resend email verification link for an unverified account.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: test@example.com
   *     responses:
   *       200:
   *         description: Generic resend response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation error
   */
  router.post(
    '/resend-verification-email',
    resendVerificationEmailValidation,
    authController.resendVerificationEmail
  );

  /**
   * @swagger
   * /api/auth/forgot-password:
   *   post:
   *     summary: Request password reset
   *     description: Generate a password reset token and send reset instructions to the user's email.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: test@example.com
   *     responses:
   *       200:
   *         description: Reset email workflow triggered (generic response)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation error
   */
  router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);

  /**
   * @swagger
   * /api/auth/reset-password:
   *   post:
   *     summary: Reset password
   *     description: Reset user password using a valid password reset token.
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [token, password, confirmPassword]
   *             properties:
   *               token:
   *                 type: string
   *                 example: b8ea2c3078e64949863c2692a5e6d8b7
   *               password:
   *                 type: string
   *                 format: password
   *                 example: NewPass@1234
   *               confirmPassword:
   *                 type: string
   *                 format: password
   *                 example: NewPass@1234
   *     responses:
   *       200:
   *         description: Password reset successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Validation error
   *       401:
   *         description: Invalid or expired reset token
   */
  router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

  /**
   * @swagger
   * /api/auth/refresh-token:
   *   post:
   *     summary: Refresh access token
   *     description: Issue a new access token and rotate refresh token using the current valid refresh token.
   *     tags: [Auth]
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: Optional when refresh token is already sent as HTTP-only cookie.
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                 expiresIn:
   *                   type: integer
   *       401:
   *         description: Missing, invalid, or expired refresh token
   */
  router.post('/refresh-token', authController.refreshToken);

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user
   *     description: Revoke refresh token and clear authentication cookie for the current session.
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: Optional when refresh token is already sent as HTTP-only cookie.
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       401:
   *         description: Not authenticated or token is invalid
   */
  router.post('/logout', authenticate, authController.logout);

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current user
   *     description: Return the currently authenticated user's profile and authorization context.
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user profile
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               nullable: true
   *               properties:
   *                 id:
   *                   type: integer
   *                 email:
   *                   type: string
   *                 username:
   *                   type: string
   *                 emailVerified:
   *                   type: boolean
   *                 roles:
   *                   type: array
   *                   items:
   *                     type: string
   *       401:
   *         description: Not authenticated
   */
  router.get('/me', authenticate, authController.getCurrentUser);

  return router;
};

export = initializeAuthRoutes;
