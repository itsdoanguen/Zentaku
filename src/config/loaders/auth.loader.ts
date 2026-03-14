/**
 * Auth Module Container Loader
 *
 * @module AuthLoader
 */

import logger from '../../shared/utils/logger';

/**
 * Load auth module dependencies into container
 *
 * @param {Container} container - DI Container instance
 */
const loadAuth = (container: any): void => {
  container.register(
    'userRepository',
    (c: any) => {
      const { User } = require('../../entities');
      const { UserRepository } = require('../../modules/user/repositories/user.repository');
      const dataSource = c.resolve('dataSource');
      const typeormRepository = dataSource.getRepository(User);

      return new UserRepository(typeormRepository);
    },
    {
      singleton: true,
      dependencies: ['dataSource'],
    }
  );

  container.register(
    'userAuthenticationRepository',
    (c: any) => {
      const { UserAuthentication } = require('../../entities');
      const {
        UserAuthenticationRepository,
      } = require('../../modules/auth/repositories/user-authentication.repository');
      const dataSource = c.resolve('dataSource');
      const typeormRepository = dataSource.getRepository(UserAuthentication);

      return new UserAuthenticationRepository(typeormRepository);
    },
    {
      singleton: true,
      dependencies: ['dataSource'],
    }
  );

  container.register(
    'refreshTokenRepository',
    (c: any) => {
      const { RefreshToken } = require('../../entities');
      const {
        RefreshTokenRepository,
      } = require('../../modules/auth/repositories/refresh-token.repository');
      const dataSource = c.resolve('dataSource');
      const typeormRepository = dataSource.getRepository(RefreshToken);

      return new RefreshTokenRepository(typeormRepository);
    },
    {
      singleton: true,
      dependencies: ['dataSource'],
    }
  );

  container.register(
    'emailService',
    () => {
      const { EmailService } = require('../../modules/auth/services/email.service');

      return new EmailService();
    },
    {
      singleton: true,
    }
  );

  container.register(
    'authService',
    (c: any) => {
      const { AuthService } = require('../../modules/auth/services/auth.service');
      const userRepository = c.resolve('userRepository');
      const userAuthenticationRepository = c.resolve('userAuthenticationRepository');
      const refreshTokenRepository = c.resolve('refreshTokenRepository');
      const emailService = c.resolve('emailService');

      return new AuthService(
        userRepository,
        userAuthenticationRepository,
        refreshTokenRepository,
        emailService
      );
    },
    {
      singleton: true,
      dependencies: [
        'userRepository',
        'userAuthenticationRepository',
        'refreshTokenRepository',
        'emailService',
      ],
    }
  );

  container.register(
    'authController',
    (c: any) => {
      const AuthController =
        require('../../modules/auth/controllers/auth.controller').default ||
        require('../../modules/auth/controllers/auth.controller');
      const authService = c.resolve('authService');

      return new AuthController(authService);
    },
    {
      singleton: true,
      dependencies: ['authService'],
    }
  );

  logger.info('[Loader] Auth module registered');
};

export = loadAuth;
