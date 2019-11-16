/// <reference types="../../typings/passport-google-oauth20" />

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import logger from '../../config/logger';
import User, { IUser, IUserDocument } from '../../models/User';
import { assertIsString } from '../../util';
import { sendMail } from '../auth-service';
import { ApiError } from '../../api/ApiError';

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
  done: (err: Error | null, user?: IUserDocument) => void,
) {
  try {
    const {
      displayName,
      emails: {
        0: { value: email },
      },
    } = profile;
    const photo = profile.photos?.[0].value ?? '';
    let user = await User.findOne({ email });
    if (!user) {
      const userInfo: IUser = {
        email,
        name: displayName,
        photo,
        verified: true,
      };
      user = await new User(userInfo).save();
      logger.info(`new Google user signed in: ${user.email}`);
      await sendMail(user);
    } else {
      // Update user document with most recent profile data.
      user.photo = photo;
      user.name = displayName;
      // If signed in with Google, the email address is verified by implication
      user.verified = true;
      await user.save();
      logger.debug(`existing Google user signed in: ${user.email}`);
    }
    done(null, user);
  } catch (error) {
    new ApiError(done).passToNext({
      error,
      status: 500,
    });
  }
}

passport.use(
  (() => {
    assertIsString(process.env.GOOGLE_CLIENT_ID);
    assertIsString(process.env.GOOGLE_CLIENT_SECRET);
    return new GoogleStrategy<IGoogleProfile, IUserDocument>(
      {
        callbackURL: '/auth/google/callback',
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
      verify,
    );
  })(),
);
