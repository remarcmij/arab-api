import { RequestHandler } from 'express';
import { withError } from '../../api/ApiError';
import logger from '../../config/logger';
import User, { encryptPassword, IUser } from '../../models/User';
import { emailConfirmationToken } from './helpers';

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

    await emailConfirmationToken(req, next, {
      clientPath: 'confirmation',
      type: 'verification',
    });

    logger.debug(`A verification email has been sent to ${user!.email}.`);
    next();
  } catch (err) {
    logger.error(err.message);
  }
};
