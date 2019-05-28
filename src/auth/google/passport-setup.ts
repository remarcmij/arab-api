import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import logger from '../../config/logger';
import { IUser, IUserDocument, User } from '../../models/User';
import { sendMail } from '../auth-service';

interface IGoogleProfile {
  id: string;
  displayName: string;
  emails: [{ value: string; verified: boolean }];
  name: { familyName: string; givenName: string };
  photos: [{ value: string }];
  provider: string;
}

// ref: https://medium.com/front-end-weekly/learn-using-jwt-with-passport-authentication-9761539c4314

passport.use(
  new GoogleStrategy<IGoogleProfile, IUserDocument>(
    {
      callbackURL: '/auth/google/callback',
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const {
          displayName,
          emails: {
            0: { value: email },
          },
        } = profile;
        const photo =
          (profile.photos && profile.photos[0] && profile.photos[0].value) ||
          '';
        let user = await User.findOne({ email });
        if (!user) {
          const userInfo: IUser = {
            email,
            name: displayName,
            status: 'registered',
            photo,
            provider: 'google',
            verified: true,
            isAdmin: false,
          };
          user = await new User(userInfo).save();
          logger.info(`new Google user sign-in: ${user.email}`);
          await sendMail(user);
        } else {
          logger.debug(`Google user sign-in: ${user.email}`);
        }
        cb(null, user);
      } catch (err) {
        cb(err);
      }
    },
  ),
);
