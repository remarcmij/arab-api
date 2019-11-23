import { RequestHandler } from 'express';
import { withError } from '../ApiError';
import User from '../../models/User';
import logger from '../../config/logger';

export const getProfile: RequestHandler = async (req, res, next) => {
  const nextWithError = withError(next);
  try {
    const user = await User.findOne({ email: req.user!.email }).select(
      '-hashedPassword',
    );
    if (!user) {
      return void nextWithError({
        status: 401,
        i18nKey: 'something_went_wrong',
      });
    }
    user.lastAccess = new Date();
    await user.save();
    logger.info(`user ${user.email} signed in`);
    res.json(user);
  } catch (error) {
    nextWithError({ status: 500, error });
  }
};
