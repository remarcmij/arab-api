import sgMail from '@sendgrid/mail';
import { compose } from 'compose-middleware';
import { NextFunction, Request, Response, RequestHandler } from 'express';
import expressJwt from 'express-jwt';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { assertIsString } from '../util';
import { withError } from '../api/ApiError';

const EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days * hours * minutes * seconds

const JWT_SECRET = process.env.JWT_SECRET ?? 'my_secret';

const validateJwt = expressJwt({
  secret: JWT_SECRET,
  credentialsRequired: true,
});

const validateOptionalJwt = expressJwt({
  secret: JWT_SECRET,
  credentialsRequired: false,
});

export const maybeAuthenticated = compose([
  validateOptionalJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    const nextWithError = withError(next);
    try {
      if (req.user) {
        // Try and replace JWT user info with full info
        // from database.
        const user = await User.findById(req.user.id);
        if (user == null) {
          return void nextWithError({
            status: 401,
            i18nKey: 'unknown_user',
          });
        }
        req.user = user;
      }
      next();
    } catch (error) {
      nextWithError({
        i18nKey: 'invalid_token',
        status: 401,
        logMsg: `id (${req.user?.id ?? 'anonymous'}) user requested: ${
          error.message
        }`,
      });
    }
  },
]);

export const isAuthenticated = compose([
  validateJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    const nextWithError = withError(next);
    try {
      const user = await User.findById(req.user?.id);
      if (!user) {
        return void nextWithError({
          status: 401,
          i18nKey: 'unknown_user',
        });
      }
      req.user = user;
      next();
    } catch (error) {
      nextWithError({
        status: 500,
        i18nKey: 'server_error',
        logMsg: `id (${req.user?.id}) user requested: ${error.message}`,
      });
    }
  },
]);

export const isAdmin = compose([
  isAuthenticated,
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user!.admin) {
      return void withError(next)({
        status: 403,
        i18nKey: 'forbidden',
      });
    }
    next();
  },
]);

const signToken = (id: string): string =>
  jwt.sign({ id }, JWT_SECRET, {
    expiresIn: EXPIRES_IN_SECONDS,
  });

/**
 * Set token cookie directly for oAuth strategies
 */
export const setTokenCookie: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return void withError(next)({
      status: 404,
      i18nKey: 'something_went_wrong',
    });
  }
  const token = signToken(req.user.id);
  res.cookie('token', JSON.stringify(token));

  const redirectUrl =
    process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:3000';
  res.redirect(redirectUrl);
};

export const sendAuthToken: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return void withError(next)({
      status: 404,
      i18nKey: 'something_went_wrong',
    });
  }
  const token = signToken(req.user.id);
  res.json({ token });
};

// TODO: send an email to the admin when an account is
// verified so that it can be considered for authorization.
// Email content to be revised.
export const sendMail = (user: IUser) => {
  assertIsString(process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  /* cSpell: disable */
  const msg = {
    // to: process.env.ADMIN_EMAIL,
    to: 'remarcmij@gmail.com',
    from: 'noreply@studiehulp-arabisch.nl',
    subject: 'Nieuwe Studiehulp Arabisch gebruiker',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };
  /* cSpell: enable */
  console.log('msg :', msg);
  console.log('user :', user);
  return sgMail.send(msg);
};
