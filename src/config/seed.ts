import User, { encryptPassword, IUser } from '../models/User';
import { assertIsString } from '../util';
import logger from './logger';

export default async () => {
  try {
    assertIsString(process.env.ADMIN_EMAIL);
    assertIsString(process.env.ADMIN_PASSWORD);

    const user = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (!user) {
      const hashedPassword = await encryptPassword(process.env.ADMIN_PASSWORD);
      const adminUser: IUser = {
        name: 'Admin',
        email: process.env.ADMIN_EMAIL!,
        password: hashedPassword,
        verified: true,
        authorized: true,
        admin: true,
      };
      await User.create(adminUser);
      logger.info('created admin user');
    }
  } catch (err) {
    logger.error(err.message);
  }
};
