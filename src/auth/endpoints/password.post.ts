import { RequestHandler } from 'express';
import { withError } from '../../api/ApiError';
import { encryptPassword } from '../../models/User';
import User from '../../models/User';

export const postAuthPassword: RequestHandler = async (req, res, next) => {
  const nextWithError = withError(next);
  try {
    // todo: password checks.
    const { password, currentPassword } = req.body;

    const email = req.user!.email;
    const user = await User.findOne({ email });

    // double check for the user existence.
    if (!user) {
      return nextWithError({
        status: 500,
        i18nKey: 'server_error',
      });
    }

    const hashedPassword = await encryptPassword(password);
    // todo: (node:8002) DeprecationWarning: collection.update is deprecated. Use updateOne, updateMany, or bulkWrite instead.
    await User.update({ email }, { password: hashedPassword, verified: true });

    next();
  } catch (error) {
    nextWithError({
      status: 500,
      i18nKey: 'server_error',
    });
  }
};
