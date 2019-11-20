import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { withError } from '../../api/ApiError';
import User, { validatePassword as comparePassword } from '../../models/User';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      const nextWithError = withError(done);
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return void nextWithError({
            status: 401,
            i18nKey: 'invalid_credentials',
            logMsg: `(${email}) user not found`,
          });
        }
        const validated =
          !!user.password && (await comparePassword(password, user.password));
        if (!validated) {
          return void nextWithError({
            status: 401,
            i18nKey: 'invalid_credentials',
            logMsg: `(${user.email}) invalid password`,
          });
        }
        return done(null, user);
      } catch (error) {
        withError(done)({
          error,
          status: 500,
        });
      }
    },
  ),
);
