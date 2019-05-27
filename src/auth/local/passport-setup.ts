import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { User, validatePassword as comparePassword } from '../../models/User';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password', // this is the virtual field on the model
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return void done(null, false, {
            message: 'Invalid credentials.',
          });
        }
        const validated = await comparePassword(password, user.hashedPassword);
        if (!validated) {
          return done(null, false, {
            message: 'Invalid credentials.',
          });
        }
        return done(null, user);
      } catch (err) {
        done(err);
      }
    },
  ),
);
