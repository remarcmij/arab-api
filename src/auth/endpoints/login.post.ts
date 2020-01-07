import { NextFunction, Request, Response } from 'express';
import { body } from 'express-validator';
import i18next from 'i18next';
import passport from 'passport';
import { withError } from '../../api/ApiError';
import { handleRequestErrors } from '../../middleware/route-validator';

export const postAuthLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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

postAuthLogin.handlers = [
  body('email', i18next.t('email_required')).isEmail(),
  body('password', i18next.t('password_required'))
    .not()
    .isEmpty(),
  handleRequestErrors,
  postAuthLogin,
];
