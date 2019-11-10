import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { ApiError } from '../../api/ApiError';
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
          return void done(
            null,
            false,
            new ApiError({
              status: 401,
              i18nKey: 'invalid_credentials',
              logMsg: `(${email}) user not found`,
            }),
          );
        }
        const validated =
          !!user.password && (await comparePassword(password, user.password));
        if (!validated) {
          return done(
            null,
            false,
            new ApiError({
              status: 401,
              i18nKey: 'invalid_credentials',
              logMsg: `(${user.email}) invalid password`,
            }),
          );
        }
        return done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);
