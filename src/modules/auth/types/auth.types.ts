export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ITokenPayload {
  userId: number;
  email: string;
  username: string;
  avatar?: string | null;
  roles?: string[];
}

export interface IAuthUser {
  id: number;
  email: string;
  username: string;
  avatar?: string | null;
  emailVerified: boolean;
  roles: string[];
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  GITHUB = 'github',
}
