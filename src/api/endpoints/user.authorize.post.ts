import { NextFunction, Request, Response } from 'express';
import { withError } from '../ApiError';
import { body } from 'express-validator';
import i18next from 'i18next';
import { handleRequestErrors } from '../../middleware/route-validator';
import User from '../../models/User';

export const postUserAuthorize = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const nextWithError = withError(next);
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return void nextWithError({
        status: 404,
        i18nKey: 'user_not_found',
      });
    }

    user.authorized = req.body.authorize;
    await user.save();

    delete user.password;
    res.status(200).json(user);
  } catch (error) {
    nextWithError({ status: 400, error });
  }
};

postUserAuthorize.handlers = [
  body('email', i18next.t('email_required'))
    .not()
    .isEmpty(),
  body('authorize', i18next.t('missing_required_failed'))
    .isBoolean()
    .not()
    .isEmpty(),
  handleRequestErrors,
  postUserAuthorize,
];
