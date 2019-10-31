import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import express, { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator/check';
import { sanitizeBody } from 'express-validator/filter';
import passport from 'passport';
import logger from '../config/logger';
import * as C from '../constants';
import User, { AuthStatus, encryptPassword, IUser } from '../models/User';
import VerificationToken, {
  IVerificationToken,
} from '../models/VerificationToken';
import { assertEnvVar } from '../util';
import { isAuthenticated, sendAuthToken, setTokenCookie } from './auth-service';
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
  [
    body('email', C.EMAIL_ADDRESS_REQUIRED).isEmail(),
    sanitizeBody('email').normalizeEmail(),
    body('password', C.PASSWORD_REQUIRED)
      .not()
      .isEmpty(),
  ],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    passport.authenticate('local', (err, user, info) => {
      const error = err || info;
      if (error) {
        return void res.status(422).json(error);
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
  sendAuthToken,
);

authRouter.post(
  '/signup',
  [
    body('name', C.NAME_REQUIRED)
      .not()
      .isEmpty(),
    body('email', C.EMAIL_ADDRESS_INVALID).isEmail(),
    sanitizeBody('email').normalizeEmail(),
    body('password', C.PASSWORD_MIN_LENGTH).isLength({
      min: 8,
    }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ message: C.USERS_ALREADY_EXISTS });
      }

      const hashedPassword = await encryptPassword(password);
      const newUser: IUser = {
        status: AuthStatus.Registered,
        name,
        email,
        hashedPassword,
      };
      user = await User.create(newUser);
      req.user = user;

      const newToken: IVerificationToken = {
        _userId: user._id,
        token: crypto.randomBytes(16).toString('hex'),
      };

      const token = new VerificationToken(newToken);
      await token.save();

      const link =
        process.env.NODE_ENV === 'production'
          ? `https://${req.headers.host}/confirmation`
          : `http://localhost:3000/confirmation`;
      const msg = {
        from: 'noreply@taalmap.nl',
        to: user.email,
        subject: 'Account Verification Token',
        text: `Hello,\n\nPlease verify your account by clicking the link: \n${link}/${token.token}.\n`,
      };

      assertEnvVar('SENDGRID_API_KEY');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
      await sgMail.send(msg);
      logger.debug(`A verification email has been sent to ${user!.email}.`);
      next();
    } catch (err) {
      logger.error(err.message);
    }
  },
  sendAuthToken,
);

authRouter.get('/verify/:token', async (req: Request, res: Response) => {
  console.log('req.params.token :', req.params.token);
  res.end();
});

authRouter.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
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
