import express, { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator/check';
import passport from 'passport';
import logger from '../config/logger';
import * as C from '../constants';
import { encryptPassword, User } from '../models/User';
import {
  isAuthenticated,
  sendMail,
  sendToken,
  setTokenCookie,
} from './auth-service';
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
  body('email', C.EMAIL_ADDRESS_REQUIRED).isEmail(),
  body('password', C.PASSWORD_REQUIRED).exists(),
  (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      const error = err || info;
      if (error) {
        return void res.status(401).json(error);
      }
      if (!user) {
        return void res.status(401).json({
          message: C.SOMETHING_WENT_WRONG,
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
    body('name', C.NAME_REQUIRED)
      .not()
      .isEmpty(),
    body('email', C.EMAIL_ADDRESS_INVALID).isEmail(),
    body('password', C.PASSWORD_MIN_LENGTH).isLength({
      min: 8,
    }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ message: C.USERS_ALREADY_EXISTS });
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
      logger.info(`new user signed up ${email}`);
      const [response] = await sendMail(user);
      if (response.statusCode === 202) {
        logger.debug('email submitted');
      }
      next();
    } catch (err) {
      logger.error(err.message);
    }
  },
  sendToken,
);

authRouter.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select(
      '-hashedPassword',
    );
    if (!user) {
      return res.sendStatus(401);
    }
    user.lastAccess = new Date();
    await user.save();
    logger.info(`user ${user.email} (${user.status}) signed in`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default authRouter;
