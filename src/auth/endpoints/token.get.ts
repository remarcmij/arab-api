import { RequestHandler } from 'express';
import { withError } from '../../api/ApiError';
import { decodeToken } from '../services';
import { emailConfirmationToken } from './helpers';

export const getAuthToken: RequestHandler = async (req, res, next) => {
  const nextWithError = withError(next);
  try {
    if (req.user?.verified) {
      return nextWithError({
        status: 400,
        i18nKey: 'already_verified',
      });
    }

    const token = req.params.tokenString;

    if (!token) {
      return nextWithError({
        status: 400,
        i18nKey: 'unexpected_error',
        logMsg: `requested confirmation token with no valid credentials by: ${req.user?.email}`,
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

    await emailConfirmationToken(req, next, {
      clientPath: 'confirmation',
      type: 'verification',
    });

    delete req.user?.password;
    res.json(req.user);
  } catch (error) {
    withError(next)({
      status: 500,
      i18nKey: 'server_error',
    });
  }
};
