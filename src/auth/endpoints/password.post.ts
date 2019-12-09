import { RequestHandler } from 'express';
import { withError } from '../../api/ApiError';
import { decodeToken } from '../services';
import { encryptPassword } from '../../models/User';
import User from '../../models/User';

export const postAuthPassword: RequestHandler = async (req, res, next) => {
  const nextWithError = withError(next);
  try {
    const token = req.params.tokenString;

    const { password } = req.body;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const email = req.user?.email;
    const user = await User.findOne({ email });

    // double check for the user existence.
    if (!user) {
      return nextWithError({
        status: 404,
        i18nKey: 'user_not_found',
        logMsg: `attempt from (${email}) changing a not owned password.`,
      });
    }

    if (!token) {
      return nextWithError({
        status: 400,
        i18nKey: 'unexpected_error',
        logMsg: `submitted password reset request with no valid credentials by: ${req.user?.email}`,
      });
    }

    const tokenResult = decodeToken(token) as { iat: number };
    const tenMinutes = 1000 * 60 * 10;
    const lessThan10MinutesAgo =
      tokenResult.iat * 1000 + tenMinutes > Date.now();

    // No spam/accidental email.
    // any user have to wait 10 minutes for a new reset password request.
    if (lessThan10MinutesAgo) {
      return nextWithError({
        status: 400,
        i18nKey: 'too_early',
      });
    }

    const hashedPassword = await encryptPassword(password);
    await User.update({ email }, { password: hashedPassword, verified: true });

    next();
  } catch (error) {
    nextWithError({
      status: 500,
      i18nKey: 'server_error',
    });
  }
};
