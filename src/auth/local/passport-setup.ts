import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import * as C from '../../constants';
import { User, validatePassword as comparePassword } from '../../models/User';

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
          return void done(null, false, {
            message: C.INVALID_CREDENTIALS,
          });
        }
        const validated =
          !!user.hashedPassword &&
          (await comparePassword(password, user.hashedPassword));
        if (!validated) {
          return done(null, false, {
            message: C.INVALID_CREDENTIALS,
          });
        }
        return done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);
