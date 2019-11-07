import sgMail from '@sendgrid/mail';
import express, { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator/check';
import { sanitizeBody } from 'express-validator/filter';
import jwt from 'jsonwebtoken';
import _template from 'lodash.template';
import passport from 'passport';
import logger from '../config/logger';
import * as C from '../constants';
import User, { AuthStatus, encryptPassword, IUser } from '../models/User';
import { assertIsString } from '../util';
import { isAuthenticated, sendAuthToken, setTokenCookie } from './auth-service';
import emailTemplate from './email-template';
import './google/passport-setup';

const compiledTemplate = _template(emailTemplate);

const router = express.Router();

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
      (req: Request, _res: Response) => {
        console.log('req.user :', req.user);
      },
    ),
  );

router.post(
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
      const error = err ?? info;
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

router.post(
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

      const payload = {
        user: {
          id: user.id,
        },
      };

      assertIsString(process.env.CONFIRMATION_SECRET);
      const confirmationSecret = process.env.CONFIRMATION_SECRET;
      const token = await jwt.sign(payload, confirmationSecret!, {
        expiresIn: '12h',
      });

      // Check if not token
      if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
      }

      const link =
        process.env.NODE_ENV === 'production'
          ? `https://${req.headers.host}/confirmation/${token}`
          : `http://localhost:3000/confirmation/${token}`;

      const subject = req.t('verification_email.subject');
      const values: object = req.t('verification_email.body', {
        returnObjects: true,
        name,
      });
      const html = compiledTemplate({ link, ...values });

      const msg = {
        from: 'noreply@taalmap.nl',
        to: user.email,
        subject,
        html,
      };

      assertIsString(process.env.SENDGRID_API_KEY);
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send(msg);
      logger.debug(`A verification email has been sent to ${user!.email}.`);
      next();
    } catch (err) {
      logger.error(err.message);
    }
  },
  sendAuthToken,
);

router.post('/confirmation', async (req: Request, res: Response) => {
  const { token } = req.body;

  try {
    assertIsString(process.env.CONFIRMATION_SECRET);
    const {
      user: { id },
    } = jwt.verify(token, process.env.CONFIRMATION_SECRET) as {
      user: { id: string };
    };

    const user = await User.findById({ _id: id });

    if (!user) {
      return res
        .status(400)
        .json({ error: 'user-not-found', msg: req.t('user_not_found') });
    }

    if (user.verified) {
      return res
        .status(400)
        .json({ error: 'already-verified', msg: req.t('already_verified') });
    }

    res.status(200).json({ msg: req.t('account_verified') });
    user.verified = true;
    await user.save();
  } catch (err) {
    logger.error(err.message);
    if (err.name === 'TokenExpiredError') {
      return res
        .status(404)
        .json({ error: 'token-expired', msg: req.t('token_expired') });
    }
    res.status(500).json({ error: 'server-error', msg: req.t('server_error') });
  }
});

router.get('/', isAuthenticated, async (req: Request, res: Response) => {
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

router.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default router;
