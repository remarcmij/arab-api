import i18next from 'i18next';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import logger from '../../config/logger';
import User, { validatePassword as comparePassword } from '../../models/User';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          logger.info(`${email}: login user not found`);
          return void done(null, false, {
            message: i18next.t('invalid_credentials'),
          });
        }
        const validated =
          !!user.password && (await comparePassword(password, user.password));
        if (!validated) {
          logger.info(`${user.email}: invalid login password`);
          return done(null, false, {
            message: i18next.t('invalid_credentials'),
          });
        }
        return done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);
