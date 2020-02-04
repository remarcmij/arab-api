import { RequestHandler } from 'express';
import logger from '../../config/logger';
import User from '../../models/User';

export const rootGet: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    let user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.sendStatus(401);
    }
    user.lastAccess = new Date();
    await user.save();
    logger.info(`user ${user.email} signed in`);

    user = { ...user.toJSON(), isSecured: !!user.password };
    delete user!.password;

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
