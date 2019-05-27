import { encryptPassword, User } from '../models/User';
import logger from './logger';

export default async () => {
  try {
    const user = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!user) {
      const hashedPassword = await encryptPassword(process.env.ADMIN_PASSWORD);
      await User.create({
        provider: 'local',
        status: 'admin',
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        hashedPassword,
        verified: true,
      });
      logger.info('created admin account');
    }
  } catch (err) {
    logger.error(err.message);
  }
};
