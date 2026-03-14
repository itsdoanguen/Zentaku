import jwt, { type JwtPayload } from 'jsonwebtoken';

const revokedAccessTokens = new Map<string, number>();

const fallbackExpiryMs = 15 * 60 * 1000;

const getAccessTokenExpiryTimestamp = (token: string): number => {
  const decoded = jwt.decode(token);

  if (decoded && typeof decoded === 'object') {
    const payload = decoded as JwtPayload;
    if (typeof payload.exp === 'number') {
      return payload.exp * 1000;
    }
  }

  return Date.now() + fallbackExpiryMs;
};

export const revokeAccessToken = (token: string): void => {
  revokedAccessTokens.set(token, getAccessTokenExpiryTimestamp(token));
};

export const isAccessTokenRevoked = (token: string): boolean => {
  const expiresAt = revokedAccessTokens.get(token);

  if (!expiresAt) {
    return false;
  }

  if (expiresAt <= Date.now()) {
    revokedAccessTokens.delete(token);
    return false;
  }

  return true;
};
