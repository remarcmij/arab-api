import { NextFunction, Request, Response } from 'express';
import { body } from 'express-validator';
import i18n from 'i18next';
import jwt from 'jsonwebtoken';
import { withError } from '../../api/ApiError';
import User, { encryptPassword, validatePassword } from '../../models/User';
import { assertIsString } from '../../util';
import { handleRequestErrors } from '../../middleware/route-validator';

const PASSWORD_MIN_LENGTH = 8;

export const patchAuthChangePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
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

patchAuthChangePassword.handlers = [
  body(
    'password',
    i18n.t('password_min_length', { minLength: PASSWORD_MIN_LENGTH }),
  ).isLength({ min: PASSWORD_MIN_LENGTH }),
  body('currentPassword', i18n.t('current_password_required'))
    .not()
    .isEmpty(),
  handleRequestErrors,
  patchAuthChangePassword,
];

export const patchAuthResetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
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

patchAuthResetPassword.handlers = [
  body('resetToken', i18n.t('reset_token_required'))
    .not()
    .isEmpty(),
  body(
    'password',
    i18n.t('password_min_length', { minLength: PASSWORD_MIN_LENGTH }),
  ).isLength({ min: PASSWORD_MIN_LENGTH }),
  handleRequestErrors,
  patchAuthResetPassword,
];
