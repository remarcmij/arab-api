import sgMail from '@sendgrid/mail';
import { compose } from 'compose-middleware';
import { NextFunction, Request, Response } from 'express';
import expressJwt from 'express-jwt';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { assertEnvVar } from '../util';

const EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days * hours * minutes * seconds

const JWT_SECRET = process.env.JWT_SECRET || 'my_secret';

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
    try {
      if (req.user) {
        // Try and replace JWT user info with full info
        // from database.
        const user = await User.findById(req.user.id);
        if (user == null) {
          return void res.status(401).json({ message: `User doesn't exist` });
        }
        req.user = user;
      }
      next();
    } catch (err) {
      return void res.status(401).json({ message: 'Invalid token' });
    }
  },
]);

interface IError extends Error {
  status?: number;
}

export const isAuthenticated = compose([
  validateJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user!.id);
      if (!user) {
        return res.status(401).json({ message: `User doesn't exist` });
      }
      req.user = user;
      next();
    } catch (err) {
      return res.status(500).json(err);
    }
  },
  async (err: IError, req: Request, res: Response, next: NextFunction) => {
    if (typeof err.status !== 'undefined') {
      return res.status(err.status).json(err);
    }
    return res.status(500).json(err);
  },
]);

export const isAdmin = compose([
  isAuthenticated,
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
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
export const setTokenCookie = (req: Request, res: Response) => {
  if (!req.user) {
    return res
      .status(404)
      .json({ message: 'Something went wrong, please try again.' });
  }
  const token = signToken(req.user.id);
  res.cookie('token', JSON.stringify(token));

  const redirectUrl =
    process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:3000';
  res.redirect(redirectUrl);
};

export const sendAuthToken = (req: Request, res: Response) => {
  if (!req.user) {
    return res
      .status(404)
      .json({ message: 'Something went wrong, please try again.' });
  }
  const token = signToken(req.user.id);
  res.json({ token });
};

export const sendMail = (user: IUser) => {
  assertEnvVar('SENDGRID_API_KEY');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
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
  return sgMail.send(msg);
};
