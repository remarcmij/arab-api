import { IApiErrorParams, withError } from '../../api/ApiError';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import User from '../../models/User';
import expressJwt from 'express-jwt';
import { compose } from 'compose-middleware';

// TS.
type AuthenticateUserObject = (errorOptions: IApiErrorParams) => RequestHandler;

// JS.
const JWT_SECRET = process.env.JWT_SECRET ?? 'my_secret';

const validateJwt = expressJwt({
  secret: JWT_SECRET,
  credentialsRequired: true,
});

const validateOptionalJwt = expressJwt({
  secret: JWT_SECRET,
  credentialsRequired: false,
});

const authenticateUserObject: AuthenticateUserObject = options => async (
  req,
  res,
  next,
) => {
  const nextWithError = withError(next);
  try {
    const isUser = !!req.user;
    if (isUser) {
      // Try and replace JWT user info with full info
      // from database.
      const user = await User.findById(req.user?.id);

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
      i18nKey: options.i18nKey,
      status: options.status,
      logMsg: options.logMsg?.replace(/\{\{message\}\}/i, error.message),
    });
  }
};

export const maybeAuthenticated = compose([
  validateOptionalJwt,
  (req: Request, res: Response, next: NextFunction) =>
    authenticateUserObject({
      i18nKey: 'invalid_token',
      status: 401,
      logMsg: `id (${req.user?.id ?? 'anonymous'}) user requested: {{message}}`,
    })(req, res, next),
]);

export const isAuthenticated = compose([
  validateJwt,
  (req: Request, res: Response, next: NextFunction) =>
    authenticateUserObject({
      status: 500,
      i18nKey: 'server_error',
      logMsg: `id (${req.user?.id}) user requested: {{message}}`,
    })(req, res, next),
]);
