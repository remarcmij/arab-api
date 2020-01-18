import { NextFunction, Request, Response } from 'express';
import { body } from 'express-validator';
import i18n from 'i18next';
import jwt from 'jsonwebtoken';
import { withError } from '../../api/ApiError';
import { handleRequestErrors } from '../../middleware/route-validator';
import User, {
  encryptPassword,
  IUser,
  validatePassword,
} from '../../models/User';
import { AppError, assertIsString } from '../../util';
import { emailForUserAuthorization } from './helpers';

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
    if (!user) {
      throw new AppError(`user ${req.user!.email} not found`);
    }

    const validated = await validatePassword(
      currentPassword,
      req.user!.password!,
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

    user.password = await encryptPassword(password);
    await user.save();

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

    assertIsString(process.env.RESET_SECRET);
    const { id } = jwt.verify(resetToken, process.env.RESET_SECRET) as {
      id: string;
    };

    const user = await User.findById(id);

    user!.password = await encryptPassword(password);
    user!.verified = true;
    await user!.save();

    emailForUserAuthorization(req, {
      clientPath: `/admin/users/options`,
      name: user!.name,
    });

    req.user = (user as unknown) as IUser;

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

export const setPasswordPatch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const nextWithError = withError(next);
  try {
    const user = await User.findOne({ email: req.user!.email });
    if (!user) {
      return nextWithError({
        status: 401,
        i18nKey: 'unknown_user',
      });
    }

    if (user.password) {
      return nextWithError({
        status: 400,
        i18nKey: 'user_already_secured',
        logMsg: `(${user!.email}) attempt to set password in secured account.`,
      });
    }

    const { password } = req.body;

    user.password = await encryptPassword(password);
    await user.save();

    next();
  } catch {
    nextWithError({
      status: 500,
      i18nKey: 'server_error',
    });
  }
};

setPasswordPatch.handlers = [
  body(
    'password',
    i18n.t('password_min_length', { minLength: PASSWORD_MIN_LENGTH }),
  ).isLength({ min: PASSWORD_MIN_LENGTH }),
  handleRequestErrors,
  setPasswordPatch,
];
