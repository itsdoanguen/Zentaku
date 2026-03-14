export interface IOAuthUserInfo {
  provider: string;
  providerId: string;
  email: string;
  displayName: string;
  avatar?: string;
  emailVerified: boolean;
}

export interface IOAuthStrategy {
  authenticate(code: string, redirectUri: string): Promise<IOAuthUserInfo>;
  getAuthorizationUrl(redirectUri: string, state?: string): string;
}
