import { Request, Response, NextFunction } from 'express';
import { withError } from '../../api/ApiError';
import logger from '../../config/logger';
import User, { encryptPassword, IUser } from '../../models/User';
import { emailConfirmationToken } from './helpers';
import { body } from 'express-validator';
import i18next from 'i18next';
import { handleRequestErrors } from '../../middleware/route-validator';

const PASSWORD_MIN_LENGTH = 8;

export const signupPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    const nextWithError = withError(next);

    if (user) {
      return nextWithError({
        status: 400,
        i18nKey: 'email_already_registered',
      });
    }

    const hashedPassword = await encryptPassword(password);
    const newUser: IUser = {
      name,
      email,
      password: hashedPassword,
    };
    user = await User.create(newUser);
    req.user = user;

    await emailConfirmationToken(req, {
      clientPath: 'confirmation',
      type: 'verification',
    });

    logger.debug(`A verification email has been sent to ${user!.email}.`);
    next();
  } catch (err) {
    logger.error(err.message);
  }
};

signupPost.handlers = [
  body('name', i18next.t('user_name_required'))
    .not()
    .isEmpty(),
  body('email', i18next.t('email_required')).isEmail(),
  body(
    'password',
    i18next.t('password_min_length', {
      minLength: PASSWORD_MIN_LENGTH,
    }),
  ).isLength({
    min: PASSWORD_MIN_LENGTH,
  }),
  handleRequestErrors,
  signupPost,
];
