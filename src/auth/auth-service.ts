import { ResponseError } from '@sendgrid/helpers/classes';
import sgMail from '@sendgrid/mail';
import express, { NextFunction, Request, Response } from 'express';
import expressJwt from 'express-jwt';
import jwt from 'jsonwebtoken';
import { IUserDocument, User } from '../models/user-model';

const EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60; // days * hours/day * minutes/hour * seconds/minute

const validateJwt = expressJwt({ secret: process.env.JWT_SECRET });

export const isAuthenticated = (() => {
  const router = express.Router();
  router.use(validateJwt);
  router.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return void res.sendStatus(401);
      }
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  });
  return router;
})();

export const hasRole = (role: string | string[]) => {
  const router = express.Router();
  router.use(isAuthenticated);
  router.use((req: Request, res: Response, next: NextFunction) => {
    const success = Array.isArray(role)
      ? role.includes(req.user.role)
      : req.user.role === role;
    if (success) {
      next();
    } else {
      res.sendStatus(403);
    }
  });
  return router;
};

const signToken = (id: string): string =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: EXPIRES_IN_SECONDS,
  });

/**
 * Set token cookie directly for oAuth strategies
 */
export const setTokenCookie = (req: Request, res: Response): void => {
  if (!req.user) {
    return void res
      .status(404)
      .json({ message: 'Something went wrong, please try again.' });
  }
  const token = signToken(req.user._id);
  res.cookie('token', JSON.stringify(token), {
    maxAge: EXPIRES_IN_SECONDS * 1000,
  });

  const redirectUrl =
    process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:3000';
  res.redirect(redirectUrl);
};

export const sendMail = (user: IUserDocument) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  /* cSpell: disable */
  const msg = {
    to: process.env.ADMIN_EMAIL_ADDRESS,
    from: 'noreply@taalmap.nl',
    subject: 'Nieuwe Studiehulp Arabisch gebruiker',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };
  /* cSpell: enable */
  console.log('msg :', msg);
  return sgMail.send(msg);
};

//   const router = express.Router();

//       // Validate jwt
//   router.use((req: Request, res: Response, next: NextFunction) => {
//         // allow access_token to be passed through query parameter as well
//         if (req.query && req.query.hasOwnProperty('access_token')) {
//           req.headers.authorization = 'Bearer ' + req.query.access_token;
//         }
//         validateJwt(req, res, next);
//       });
//       // Attach user to request
//   router.use((req: Request, res: Response, next: NextFunction) => {
//         UserModel.findById(req.user._id, (err, user) => {
//           if (err) {
//             return next(err);
//           }
//           if (!user) {
//             return res.sendStatus(401);
//           }
//           if (user.disabled) {
//             return res.status(401).send('account disabled');
//           }
//           req.user = user;
//           next();
//         });
//       });
//   )
// }
