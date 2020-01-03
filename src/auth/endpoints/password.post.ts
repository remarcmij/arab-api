import { NextFunction, Request, Response } from 'express';
import { emailResetToken } from './helpers';
import { withError } from '../../api/ApiError';
import User from '../../models/User';
import { body, sanitizeBody } from 'express-validator';
import { handleRequestErrors } from '../../middleware/route-validator';
import i18next from 'i18next';

export const postAuthPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const nextWithError = withError(next);
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return nextWithError({
        status: 400,
        i18nKey: 'unknown_user',
      });
    }

    req.user = user;

    await emailResetToken(req, {
      clientPath: 'password',
      expiresIn: '10m',
    });

    res.sendStatus(200);
  } catch (error) {
    nextWithError({
      status: 500,
      i18nKey: 'server_error',
    });
  }
};

postAuthPassword.handlers = [
  body('email', i18next.t('email_required')).isEmail(),
  sanitizeBody('email').normalizeEmail(),
  handleRequestErrors,
  postAuthPassword,
];
