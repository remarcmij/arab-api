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
      const errorHandler = new ApiError(done, null, false);
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return void errorHandler.passToNext({
            status: 401,
            i18nKey: 'invalid_credentials',
            logMsg: `(${email}) user not found`,
          });
        }
        const validated =
          !!user.password && (await comparePassword(password, user.password));
        if (!validated) {
          return void errorHandler.passToNext({
            status: 401,
            i18nKey: 'invalid_credentials',
            logMsg: `(${user.email}) invalid password`,
          });
        }
        return done(null, user);
      } catch (error) {
        new ApiError(done).passToNext({
          error,
          status: 500,
        });
      }
    },
  ),
);
