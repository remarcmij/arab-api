import { RequestHandler } from 'express';
import { sanitizeBody } from 'express-validator/filter';
import { sendConfirmationToken } from '.';
import User, { encryptPassword, IUser } from '../../models/User';
import logger from '../../config/logger';
import { validateRouteBody } from '../../middleware/route-validator';
import { handleRequestErrors } from '../../middleware/route-validator';
import { withError } from '../../api/ApiError';

const PASSWORD_MIN_LENGTH = 8;

export const postAuthPasswordChecks = [
  validateRouteBody('password', 'password_min_length', {
    minLength: PASSWORD_MIN_LENGTH,
  }).isLength({
    min: PASSWORD_MIN_LENGTH,
  }),
  handleRequestErrors,
];

export const postAuthSignupChecks = [
  validateRouteBody('name', 'user_name_required')
    .not()
    .isEmpty(),
  validateRouteBody('email', 'email_required').isEmail(),
  sanitizeBody('email').normalizeEmail(),
  ...postAuthPasswordChecks,
];

export const postAuthSignup: RequestHandler = async (req, res, next) => {
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

    await sendConfirmationToken(req, next);

    logger.debug(`A verification email has been sent to ${user!.email}.`);
    next();
  } catch (err) {
    logger.error(err.message);
  }
};
