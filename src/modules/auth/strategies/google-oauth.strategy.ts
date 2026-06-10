import axios from 'axios';
import type { IOAuthStrategy, IOAuthUserInfo } from './oauth-strategy.interface';

export class GoogleOAuthStrategy implements IOAuthStrategy {
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
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

  async authenticate(code: string, redirectUri: string): Promise<IOAuthUserInfo> {
    try {
      // 1. Exchange authorization code for access token
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const { access_token } = tokenResponse.data;

      // 2. Fetch user information using access token
      const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userInfo = userResponse.data;

      return {
        provider: 'google',
        providerId: userInfo.id,
        email: userInfo.email,
        emailVerified: userInfo.verified_email ?? true,
        displayName: userInfo.name,
        avatar: userInfo.picture,
      };
    } catch (error: any) {
      console.error('Google OAuth Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Google');
    }
  }
}
