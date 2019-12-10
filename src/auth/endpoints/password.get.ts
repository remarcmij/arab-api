import { RequestHandler } from 'express';
import { withError } from '../../api/ApiError';
import { decodeToken } from '../services';
import { sendResetPasswordToken } from '.';

export const getAuthResetPassRequest: RequestHandler = async (req, res, next) => {
  const nextWithError = withError(next);
  try {

    const token = req.get('Authorization');

    if (!token) {
      return nextWithError({
        status: 400,
        i18nKey: 'unexpected_error',
        logMsg: `requested password reset token with no valid credentials by: ${req.user?.email || 'unknown'}`,
      });
    }

    const tokenResult = decodeToken(token) as { iat: number };
    const twoMinutes = 1000 * 60 * 2;
    const lessThan2MinutesAgo =
      tokenResult.iat * 1000 + twoMinutes > Date.now();

    // No spam/accidental email.
    // any user have to wait 2 minutes to send new email if already sent.
    if (lessThan2MinutesAgo) {
      return nextWithError({
        status: 400,
        i18nKey: 'too_early',
      });
    }

    await sendResetPasswordToken(req, next);

    delete req.user?.password;
    res.json(req.user);
  } catch (error) {
    nextWithError({
      status: 500,
      i18nKey: 'server_error',
    });
  }
};
