import express, { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator/check';
import passport from 'passport';
import logger from '../config/logger';
import { encryptPassword, User } from '../models/User';
import { sendToken, setTokenCookie } from './auth-service';
import './google/passport-setup';

const authRouter = express.Router();

authRouter
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

authRouter.post(
  '/login',
  body('email', 'The email address is invalid').isEmail(),
  body('password', 'Password is required').exists(),
  (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      const error = err || info;
      if (error) {
        return void res.status(401).json(error);
      }
      if (!user) {
        return void res.status(401).json({
          message: 'Something went wrong, please try again.',
        });
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  sendToken,
);

authRouter.post(
  '/signup',
  [
    body('name', 'Name is required')
      .not()
      .isEmpty(),
    body('email', 'The email address is invalid').isEmail(),
    body(
      'password',
      'Please enter a password of 8 characters or more',
    ).isLength({
      min: 8,
    }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await encryptPassword(password);
    user = await User.create({
      provider: 'local',
      status: 'registered',
      name,
      email,
      hashedPassword,
    });
    req.user = user;
    logger.info(`created account for ${email}`);
    next();
  },
  sendToken,
);

export default authRouter;
