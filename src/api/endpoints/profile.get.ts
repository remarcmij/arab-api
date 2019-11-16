import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../ApiError';
import User from '../../models/User';
import logger from '../../config/logger';

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errorHandler = new ApiError(next);
  try {
    const user = await User.findOne({ email: req.user!.email }).select(
      '-hashedPassword',
    );
    if (!user) {
      return void errorHandler.passToNext({
        status: 401,
        i18nKey: 'something_went_wrong',
      });
    }
    user.lastAccess = new Date();
    await user.save();
    logger.info(`user ${user.email} signed in`);
    res.json(user);
  } catch (error) {
    errorHandler.passToNext({ status: 500, error });
  }
};
