import sgMail from '@sendgrid/mail';
import { compose } from 'compose-middleware';
import { NextFunction, Request, Response } from 'express';
import expressJwt from 'express-jwt';
import jwt from 'jsonwebtoken';
import { IUserDocument, User } from '../models/User';

const EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60; // days * hours/day * minutes/hour * seconds/minute

const JWT_SECRET = process.env.JWT_SECRET || 'my_secret';

const validateJwt = expressJwt({
  secret: JWT_SECRET,
  credentialsRequired: true,
});

const validateOptionalJwt = expressJwt({
  secret: JWT_SECRET,
  credentialsRequired: false,
});

export const authResolve = compose([
  validateOptionalJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        req.user = { status: 'visitor' };
        return next();
      }
      const user = await User.findById(req.user.id);
      if (!user) {
        return void res.status(401).json({ message: `User doesn't exist` });
      }
      req.user = user;
      next();
    } catch (err) {
      return void res.status(401).json({ message: 'Invalid token' });
    }
  },
]);

export const isAuthenticated = compose([
  validateJwt,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({ message: `User doesn't exist` });
      }
      req.user = user;
      next();
    } catch (err) {
      return res.status(500).json(err);
    }
  },
  async (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
      return res.status(err.status).json(err);
    }
    return res.status(500).json(err);
  },
]);

export const isUser = compose([
  isAuthenticated,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.user.status !== 'user') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  },
]);

export const isAdmin = compose([
  isUser,
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user.isAdmin) {
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
  res.cookie('token', JSON.stringify(token), {
    maxAge: EXPIRES_IN_SECONDS * 1000,
  });

  const redirectUrl =
    process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:3000';
  res.redirect(redirectUrl);
};

export const sendToken = (req: Request, res: Response) => {
  if (!req.user) {
    return res
      .status(404)
      .json({ message: 'Something went wrong, please try again.' });
  }
  const token = signToken(req.user.id);
  res.json({ token });
};

export const sendMail = (user: IUserDocument) => {
  if (process.env.SENDGRID_API_KEY == null) {
    throw new Error('Missing SendGrid API key environment variable');
  }
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
  return sgMail.send(msg);
};
