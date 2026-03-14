import type { IUserRepository } from '../../user/repositories/user.repository';
import type { IUserAuthenticationRepository } from '../repositories/user-authentication.repository';
import type { IOAuthStrategy } from '../strategies/oauth-strategy.interface';
import type { IAuthTokens } from '../types/auth.types';
import { PasswordUtil } from '../utils/password.util';
import { TokenUtil } from '../utils/token.util';

export class OAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userAuthRepository: IUserAuthenticationRepository,
    private readonly strategies: Map<string, IOAuthStrategy>
  ) {}

  async authenticateWithProvider(
    provider: string,
    code: string,
    redirectUri: string
  ): Promise<IAuthTokens> {
    const strategy = this.strategies.get(provider);
    if (!strategy) {
      throw new Error(`OAuth provider ${provider} not supported`);
    }

    const oauthUser = await strategy.authenticate(code, redirectUri);

    const existingAuth = await this.userAuthRepository.findByOAuthProvider(
      provider,
      oauthUser.providerId
    );

    let user = existingAuth?.user ?? null;

    if (!user) {
      user = await this.userRepository.findByEmail(oauthUser.email);

      if (user) {
        const auth = await this.userAuthRepository.findByUserId(this.toNumberId(user.id));
        if (auth) {
          await this.userAuthRepository.update(auth.id, {
            oauthProvider: provider,
            oauthProviderId: oauthUser.providerId,
            emailVerified: oauthUser.emailVerified,
          });
        }
      } else {
        const randomPassword = PasswordUtil.generateRandomPassword();
        const passwordHash = await PasswordUtil.hash(randomPassword);

        user = await this.userRepository.create({
          email: oauthUser.email,
          username: this.generateUsername(oauthUser.email),
          displayName: oauthUser.displayName,
          avatar: oauthUser.avatar,
        });

        await this.userAuthRepository.create({
          userId: this.toNumberId(user.id),
          passwordHash,
          oauthProvider: provider,
          oauthProviderId: oauthUser.providerId,
          emailVerified: oauthUser.emailVerified,
          isActive: true,
        });
      }
    }

    const payload = {
      userId: this.toNumberId(user.id),
      email: user.email,
      username: user.username,
      roles: user.roles?.map((role) => role.name) ?? [],
    };

    const accessToken = TokenUtil.generateAccessToken(payload);
    const refreshToken = TokenUtil.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: TokenUtil.getAccessTokenExpiresIn(),
    };
  }

  getAuthorizationUrl(provider: string, redirectUri: string, state?: string): string {
    const strategy = this.strategies.get(provider);
    if (!strategy) {
      throw new Error(`OAuth provider ${provider} not supported`);
    }

    return strategy.getAuthorizationUrl(redirectUri, state);
  }

  private generateUsername(email: string): string {
    const baseUsername = (email.split('@')[0] ?? 'user').replace(/[^a-zA-Z0-9_-]/g, '');
    const randomSuffix = Math.floor(Math.random() * 10000);
    return `${baseUsername}${randomSuffix}`;
  }

  private toNumberId(id: number | bigint): number {
    return typeof id === 'bigint' ? Number(id) : id;
  }
}
