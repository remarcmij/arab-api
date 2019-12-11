import { RequestHandler } from 'express';
import { sanitizeBody } from 'express-validator';
import _template from 'lodash.template';
import passport from 'passport';
import { withError } from '../../api/ApiError';
import {
  validateRouteBody,
  handleRequestErrors,
} from '../../middleware/route-validator';

export const postAuthLoginChecks = [
  validateRouteBody('email', 'email_required').isEmail(),
  sanitizeBody('email').normalizeEmail(),
  validateRouteBody('password', 'password_required')
    .not()
    .isEmpty(),
  handleRequestErrors,
];

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
