import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { withError } from '../../api/ApiError';

const EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days * hours * minutes * seconds

const JWT_SECRET = process.env.JWT_SECRET ?? 'my_secret';

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

// send for both AuthN OR AuthZ
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
