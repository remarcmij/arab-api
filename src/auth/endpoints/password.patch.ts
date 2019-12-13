import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { withError } from '../../api/ApiError';
import User, { encryptPassword, validatePassword } from '../../models/User';
import { assertIsString } from '../../util';

export const patchAuthChangePassword: RequestHandler = async (
  req,
  res,
  next,
) => {
  const nextWithError = withError(next);
  try {
    const { password, currentPassword } = req.body;

    const user = await User.findOne({ email: req.user!.email });

    const validated = await validatePassword(
      currentPassword,
      req.user?.password!,
    );

    if (!validated) {
      return void nextWithError({
        status: 401,
        i18nKey: 'password_invalid',
        logMsg: `(${user!.email}) invalid password while changing passwords.`,
      });
    }

    if (password === currentPassword) {
      return nextWithError({
        status: 400,
        i18nKey: 'passwords_cant_match',
      });
    }

    const hashedPassword = await encryptPassword(password);

    await User.updateOne(
      { email: req.user!.email },
      { password: hashedPassword, verified: req.user!.verified },
    );

    next();
  } catch (error) {
    nextWithError({
      status: 500,
      i18nKey: 'server_error',
    });
  }
};

export const patchAuthResetPassword: RequestHandler = async (
  req,
  res,
  next,
) => {
  const nextWithError = withError(next);
  try {
    const { password, resetToken } = req.body;

    assertIsString(process.env.CONFIRMATION_SECRET);
    const { id } = jwt.verify(resetToken, process.env.CONFIRMATION_SECRET) as {
      id: string;
    };

    const user = await User.findById(id);

    if (!user) {
      return nextWithError({
        status: 500,
        i18nKey: 'server_error',
        logMsg: 'password reset: user not found',
      });
    }

    user.password = await encryptPassword(password);
    user.verified = true;
    await user.save();

    req.user = user;

    next();
  } catch (error) {
    nextWithError({
      status: 500,
      i18nKey: 'server_error',
    });
  }
};
