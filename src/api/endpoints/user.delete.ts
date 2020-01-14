import { NextFunction, Request, Response } from 'express';
import { body } from 'express-validator';
import i18next from 'i18next';
import logger from '../../config/logger';
import { handleRequestErrors } from '../../middleware/route-validator';
import User from '../../models/User';
import { withError } from '../ApiError';

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const nextWithError = withError(next);
  try {
    const result = await User.deleteOne({ email: req.body.email });

    if (!result.deletedCount) {
      return void nextWithError({
        status: 404,
        i18nKey: 'user_not_found',
      });
    }

    logger.info(`user ${req.body.email} removed`);

    res.status(200).json({ message: `user ${req.body.email} removed` });
  } catch (error) {
    nextWithError({ status: 400, error });
  }
};

deleteUser.handlers = [
  body('email', i18next.t('email_required'))
    .not()
    .isEmpty(),
  handleRequestErrors,
  deleteUser,
];
