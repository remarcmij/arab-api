import { RequestHandler } from 'express';
import User from '../../models/User';
import logger from '../../config/logger';

export const getAuthRoot: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const user = await User.findOne({ email: req.user.email }).select(
      '-password',
    );
    if (!user) {
      return res.sendStatus(401);
    }
    user.lastAccess = new Date();
    await user.save();
    logger.info(`user ${user.email} signed in`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
