import type { IOAuthStrategy, IOAuthUserInfo } from './oauth-strategy.interface';

export class GoogleOAuthStrategy implements IOAuthStrategy {
  private readonly clientId: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    void clientSecret;
  }

  getAuthorizationUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: state ?? '',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async authenticate(_code: string, _redirectUri: string): Promise<IOAuthUserInfo> {
    throw new Error('Google OAuth not implemented yet');
  }
}
