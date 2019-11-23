import { isAuthenticated } from '.';
import { Request, Response, NextFunction } from 'express';
import { withError } from '../../api/ApiError';
import { compose } from 'compose-middleware';

export const isAdmin = compose([
  isAuthenticated,
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user!.admin) {
      return void withError(next)({
        status: 403,
        i18nKey: 'forbidden',
      });
    }
    next();
  },
]);
