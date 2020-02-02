import { Request, Response } from 'express';
import passport from 'passport';

export const googleGet = passport.authenticate(
  'google',
  {
    scope: ['openid', 'profile', 'email'],
    session: false,
  },
  (req: Request, _res: Response) => {
    console.log('req.user :', req.user);
  },
);

export const googleCallbackGet = passport.authenticate('google', {
  session: false,
});
