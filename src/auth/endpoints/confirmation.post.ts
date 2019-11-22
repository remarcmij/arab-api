import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import logger from '../../config/logger';
import { assertIsString } from '../../util';

export const postAuthConfirmation: RequestHandler = async (req, res) => {
  const { token } = req.body;

  try {
    assertIsString(process.env.CONFIRMATION_SECRET);
    const {
      user: { id },
    } = jwt.verify(token, process.env.CONFIRMATION_SECRET) as {
      user: { id: string };
    };

    const user = await User.findById({ _id: id });

    if (!user) {
      return res
        .status(400)
        .json({ error: 'user-not-found', msg: req.t('user_not_found') });
    }

    if (user.verified) {
      return res
        .status(400)
        .json({ error: 'already-verified', msg: req.t('already_verified') });
    }

    res.status(200).json({ msg: req.t('account_verified') });
    user.verified = true;
    await user.save();
  } catch (err) {
    logger.error(err.message);
    if (err.name === 'TokenExpiredError') {
      return res
        .status(404)
        .json({ error: 'token-expired', msg: req.t('token_expired') });
    }
    res.status(500).json({ error: 'server-error', msg: req.t('server_error') });
  }
};
