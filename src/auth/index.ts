import express, { Request, Response } from 'express';
import passport from 'passport';
import { setTokenCookie } from './auth-service';
import './google/passport-setup';

const router = express.Router();

const loginGoogle = (req: Request, res: Response) => {
  res.send('Logging in with google');
};

const logout = (req: Request, res: Response) => {
  res.send('Logging out');
};

router
  .get(
    '/google/callback',
    passport.authenticate('google', { session: false }),
    setTokenCookie,
  )
  .get(
    '/google',
    passport.authenticate(
      'google',
      {
        scope: ['openid', 'profile', 'email'],
        session: false,
      },
      (req: Request, res: Response) => {
        console.log('req.user :', req.user);
      },
    ),
  );

export default router;
