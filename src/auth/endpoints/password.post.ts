import { RequestHandler } from 'express';
import { emailResetToken } from './helpers';
import { withError } from '../../api/ApiError';
import User from '../../models/User';

export const postAuthPassword: RequestHandler = async (req, res, next) => {
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

    await emailResetToken(req, next, {
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
