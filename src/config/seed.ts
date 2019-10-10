import { encryptPassword, User } from '../models/User';
import logger from './logger';

export default async () => {
  try {
    if (process.env.ADMIN_EMAIL == null) {
      throw new Error('Missing admin email environment variable');
    }
    if (process.env.ADMIN_PASSWORD == null) {
      throw new Error('Missing admin password environment variable');
    }

    const user = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (!user) {
      const hashedPassword = await encryptPassword(process.env.ADMIN_PASSWORD);
      await User.create({
        provider: 'local',
        status: 'user',
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        hashedPassword,
        verified: true,
        isAdmin: true,
      });
      logger.info('created admin account');
    }
  } catch (err) {
    logger.error(err.message);
  }
};
