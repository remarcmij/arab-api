import jwt from 'jsonwebtoken';
import { RequestHandler, Request } from 'express';
import { withError } from '../../api/ApiError';
import { assertIsString } from '../../util';

const EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60; // 30 days * hours * minutes * seconds

const JWT_SECRET = process.env.JWT_SECRET ?? 'my_secret';

export const signToken = (id: string, expiresIn?: string | number): string =>
  jwt.sign({ id }, JWT_SECRET, {
    expiresIn: expiresIn || EXPIRES_IN_SECONDS,
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

export const generateConfirmationToken = async (
  req: Request,
  expiresIn?: string,
) => {
  const payload = {
    user: {
      id: req.user?.id,
    },
  };

  assertIsString(process.env.CONFIRMATION_SECRET);
  const confirmationSecret = process.env.CONFIRMATION_SECRET;
  const token = await jwt.sign(payload, confirmationSecret!, {
    expiresIn: expiresIn || '12h',
  });

  return token;
};

export const decodeToken = (token: string) => {
  token = token.replace(/^Bearer\s/, '');
  const decoded = jwt.decode(token);
  return decoded;
};
