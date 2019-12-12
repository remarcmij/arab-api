import { RequestHandler } from 'express';
import { withError } from '../../api/ApiError';
import { validatePassword, encryptPassword } from '../../models/User';
import User from '../../models/User';
import { decodeToken } from '../services';

export const patchAuthPassword: RequestHandler = async (req, res, next) => {
  const nextWithError = withError(next);
  try {
    const { password, currentPassword, resetProcess } = req.body;

    const email = req.user!.email;
    const user = await User.findOne({ email });

    const token = req.get('Authorization');

    // double check for the user existence.
    if (!user || !token) {
      return nextWithError({
        status: 500,
        i18nKey: 'server_error',
        logMsg: `requested a change password reset no valid credentials by: ${req
          .user?.email || 'unknown'}`,
      });
    }

    // if the token expires in 10 minutes, it's a reset process!
    const tokenResult = decodeToken(token) as { iat: number; exp: number };
    const tenMinutes = 1000 * 60 * 10;
    const tokenEXPDuration = (tokenResult.exp - tokenResult.iat) * 1000;

    const isResetProcess = !!(tenMinutes === tokenEXPDuration) && resetProcess;

    if (!isResetProcess && !currentPassword) {
      return void nextWithError({
        status: 400,
        i18nKey: 'password_required',
        logMsg: `(${email}) requested password change with no password.`,
      });
    }

    const validated = await validatePassword(
      currentPassword,
      req.user?.password!,
    );

    if (!isResetProcess && !validated) {
      return void nextWithError({
        status: 401,
        i18nKey: 'password_invalid',
        logMsg: `(${user.email}) invalid password while changing passwords.`,
      });
    }

    if (!isResetProcess && password === currentPassword) {
      return nextWithError({
        status: 400,
        i18nKey: 'passwords_cant_match',
      });
    }

    const hashedPassword = await encryptPassword(password);

    if (!req.user?.verified) {
      req.user!.verified = isResetProcess;
    }

    await User.updateOne(
      { email },
      { password: hashedPassword, verified: req.user?.verified },
    );

    next();
  } catch (error) {
    nextWithError({
      status: 500,
      i18nKey: 'server_error',
    });
  }
};
