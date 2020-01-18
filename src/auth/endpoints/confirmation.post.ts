import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { withError } from '../../api/ApiError';
import User from '../../models/User';
import { assertIsString } from '../../util';
import { emailForUserAuthorization } from './helpers';

export const postAuthConfirmation: RequestHandler = async (req, res, next) => {
  const { token } = req.body;
  const nextWithError = withError(next);

  try {
    assertIsString(process.env.CONFIRMATION_SECRET);
    const {
      user: { id },
    } = jwt.verify(token, process.env.CONFIRMATION_SECRET) as {
      user: { id: string };
    };

    const user = await User.findById({ _id: id });

    if (!user) {
      return nextWithError({
        status: 400,
        i18nKey: 'user_not_found',
      });
    }

    if (user.verified) {
      return nextWithError({
        status: 400,
        i18nKey: 'already_verified',
      });
    }

    user.verified = true;
    await user.save();

    emailForUserAuthorization(req, {
      clientPath: `/admin/users`,
      name: user.name,
    });

    res.status(200).json({ message: req.t('account_verified') });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return nextWithError({
        // For best practice see: https://tools.ietf.org/html/rfc6750#page-9
        // since we are using them under the same scope name.
        status: 401,
        i18nKey: 'token_expired',
      });
    }
    nextWithError({
      status: 500,
      i18nKey: 'server_error',
      logMsg: `Tokenizing error: ${error.message}`,
    });
  }
};
