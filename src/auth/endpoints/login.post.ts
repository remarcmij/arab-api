import { RequestHandler } from 'express';
import passport from 'passport';
import { withError } from '../../api/ApiError';

export const postAuthLogin: RequestHandler = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    const error = err ?? info;
    if (error) {
      return next(error);
    }
    if (!user) {
      return withError(next)({
        status: 401,
        i18nKey: 'something_went_wrong',
      });
    }
    req.user = user;
    next();
  })(req, res, next);
};
