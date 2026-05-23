import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Container } from '../../../config/container';
import { UnauthorizedError } from '../../../shared/utils/error';
import { isAccessTokenRevoked } from '../../auth/utils/access-token-revocation.util';
import { TokenUtil } from '../../auth/utils/token.util';

interface IListAccessService {
  assertListOwner(listId: number, userId: number): Promise<unknown>;
  assertCanEditList(listId: number, userId: number): Promise<unknown>;
  assertCanViewList(listId: number, userId?: number): Promise<unknown>;
}

const attachOptionalUser = (req: Request): void => {
  if (req.user) {
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Invalid authorization header');
  }

  const token = authHeader.substring(7);
  if (isAccessTokenRevoked(token)) {
    throw new UnauthorizedError('Token has been revoked. Please login again.');
  }

  req.user = TokenUtil.verifyAccessToken(token);
};

const getListService = (container: Container): IListAccessService => {
  return container.resolve<IListAccessService>('listService');
};

const getListId = (req: Request): number => {
  return Number.parseInt(req.params.listId ?? '', 10);
};

const getUserId = (req: Request): number | undefined => {
  return req.user?.userId;
};

const runGuard =
  (container: Container, mode: 'owner' | 'edit' | 'view'): RequestHandler =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      attachOptionalUser(req);

      const listService = getListService(container);
      const listId = getListId(req);
      const userId = getUserId(req);

      if (!Number.isInteger(listId) || listId <= 0) {
        throw new UnauthorizedError('Invalid list ID');
      }

      if (mode === 'view') {
        await listService.assertCanViewList(listId, userId);
      } else {
        if (!userId) {
          throw new UnauthorizedError('Authentication required');
        }

        if (mode === 'owner') {
          await listService.assertListOwner(listId, userId);
        } else {
          await listService.assertCanEditList(listId, userId);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export const isListOwner = (container: Container): RequestHandler => runGuard(container, 'owner');

export const canEditList = (container: Container): RequestHandler => runGuard(container, 'edit');

export const canViewList = (container: Container): RequestHandler => runGuard(container, 'view');
