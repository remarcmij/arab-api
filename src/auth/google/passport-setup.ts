/// <reference types="../../typings/passport-google-oauth20" />

import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { withError } from '../../api/ApiError';
import logger from '../../config/logger';
import User, { IUser, IUserDocument } from '../../models/User';
import { assertIsString } from '../../util';
import { emailForUserAuthorization } from '../endpoints/helpers';

interface IGoogleProfile {
  id: string;
  displayName: string;
  emails: [{ value: string; verified: boolean }];
  name: { familyName: string; givenName: string };
  photos: [{ value: string }];
  provider: string;
}

// ref: https://medium.com/front-end-weekly/learn-using-jwt-with-passport-authentication-9761539c4314

function verify(req: Request) {
  return async (
    _accessToken: string,
    _refreshToken: string,
    profile: IGoogleProfile,
    done: (err: Error | null, user?: IUserDocument) => void,
  ) => {
    try {
      const {
        displayName,
        emails: {
          0: { value: email },
        },
      } = profile;

      let user = await User.findOne({ email });
      if (!user) {
        const userInfo: IUser = {
          email,
          name: displayName,
          verified: false,
        };
        user = await new User(userInfo);
        logger.info(`new Google user signed in: ${user.email}`);
      }

      if (!user.verified) {
        await emailForUserAuthorization(req, {
          clientPath: `/admin/users/authorization?email=${user.email}`,
          name: user.name,
        });
      }

      // If signed in with Google, the email address is verified by implication
      user.verified = true;

      // Update user document with most recent profile data.
      user.photo = profile.photos?.[0].value ?? '';
      user.name = displayName;
      await user.save();

      logger.debug(`existing Google user signed in: ${user.email}`);

      done(null, user);
    } catch (error) {
      withError(done)({
        error,
        status: 500,
      });
    }
  };
}

export default (req: Request, res: Response, next: NextFunction) => {
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
        verify(req),
      );
    })(),
  );
  next();
};
