import sgMail from '@sendgrid/mail';
import express, { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator/check';
import { sanitizeBody } from 'express-validator/filter';
import i18next from 'i18next';
import jwt from 'jsonwebtoken';
import _template from 'lodash.template';
import passport from 'passport';
import { withError } from '../api/ApiError';
import logger from '../config/logger';
import User, { encryptPassword, IUser } from '../models/User';
import { assertIsString } from '../util';
import { isAuthenticated, sendAuthToken, setTokenCookie } from './auth-service';
import emailTemplate from './email-template';
import './google/passport-setup';

const PASSWORD_MIN_LENGTH = 8;

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
    body('email', i18next.t('email_required')).isEmail(),
    sanitizeBody('email').normalizeEmail(),
    body('password', i18next.t('password_required'))
      .not()
      .isEmpty(),
  ],
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return void res.status(422).json({ errors: errors.array() });
    }
    passport.authenticate('local', (err, user, info): void => {
      const error = err ?? info;
      if (error) {
        return next(error);
      }
      if (!user) {
        return withError(next)({
          status: 401,
          i18nKey: 'something_went_wrong',
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
    body('name', i18next.t('user_name_required'))
      .not()
      .isEmpty(),
    body('email', i18next.t('email_required')).isEmail(),
    sanitizeBody('email').normalizeEmail(),
    body(
      'password',
      i18next.t('password_min_length', { minLength: PASSWORD_MIN_LENGTH }),
    ).isLength({
      min: PASSWORD_MIN_LENGTH,
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
        return res
          .status(400)
          .json({ message: i18next.t('email_already_registered') });
      }

      const hashedPassword = await encryptPassword(password);
      const newUser: IUser = {
        name,
        email,
        password: hashedPassword,
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
      '-password',
    );
    if (!user) {
      return res.sendStatus(401);
    }
    user.lastAccess = new Date();
    await user.save();
    logger.info(`user ${user.email} signed in`);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default router;
