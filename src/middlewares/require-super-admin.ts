import type { NextFunction, Request, Response } from 'express';
import { SystemRole } from '../entities/types/enums';

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;

  if (!user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  if (user.systemRole !== SystemRole.SUPER_ADMIN) {
    res.status(403).json({ message: 'Super Admin privileges required' });
    return;
  }

  next();
};
