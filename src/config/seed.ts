import User, { encryptPassword, IUser } from '../models/User';
import { assertEnvVar } from '../util';
import logger from './logger';

export default async () => {
  try {
    assertEnvVar('ADMIN_EMAIL');
    assertEnvVar('ADMIN_PASSWORD');

    const user = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (!user) {
      const hashedPassword = await encryptPassword(process.env.ADMIN_PASSWORD!);
      await User.create({
        provider: 'local',
        status: 'authorized',
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        hashedPassword,
        verified: true,
        isAdmin: true,
      } as IUser);
      logger.info('created admin account');
    }
  } catch (err) {
    logger.error(err.message);
  }
};
