import { NextFunction, Request, Response } from 'express';
import { body } from 'express-validator';
import i18next from 'i18next';
import { withError } from '../../api/ApiError';
import { handleRequestErrors } from '../../middleware/route-validator';
import User from '../../models/User';
import { emailResetToken } from './helpers';

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
  handleRequestErrors,
  postAuthPassword,
];
