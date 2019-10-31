/// <reference types="../../typings/passport-google-oauth20" />

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import logger from '../../config/logger';
import User, { AuthStatus, IUser, IUserDocument } from '../../models/User';
import { assertEnvVar } from '../../util';
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

async function verify(
  _accessToken: string,
  _refreshToken: string,
  profile: IGoogleProfile,
  cb: (err: Error | null, user?: IUserDocument) => void,
) {
  try {
    const {
      displayName,
      emails: {
        0: { value: email },
      },
    } = profile;
    const photo =
      (profile.photos && profile.photos[0] && profile.photos[0].value) || '';
    let user = await User.findOne({ email });
    if (!user) {
      const userInfo: IUser = {
        email,
        name: displayName,
        status: AuthStatus.Registered,
        photo,
        verified: true,
        isAdmin: false,
      };
      user = await new User(userInfo).save();
      logger.info(`new Google user signed in: ${user.email}`);
      await sendMail(user);
    } else {
      logger.debug(`existing Google user signed in: ${user.email}`);
    }
    cb(null, user);
  } catch (err) {
    cb(err);
  }
}

passport.use(
  (() => {
    assertEnvVar('GOOGLE_CLIENT_ID');
    assertEnvVar('GOOGLE_CLIENT_SECRET');
    return new GoogleStrategy<IGoogleProfile, IUserDocument>(
      {
        callbackURL: '/auth/google/callback',
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      verify,
    );
  })(),
);
