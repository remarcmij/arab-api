import express, { Request, Response } from 'express';
import {
  getAuthGoogle,
  getAuthGoogleCallback,
  getAuthResetPassRequest,
  getAuthRoot,
  getAuthToken,
  patchAuthChangePassword,
  patchAuthResetPassword,
  postAuthConfirmation,
  postAuthLogin,
  postAuthPassword,
  postAuthSignup,
} from './endpoints';
import './google/passport-setup';
import { isAuthenticated, sendAuthToken, setTokenCookie } from './services';

const router = express.Router();

router
  .get('/google/callback', getAuthGoogleCallback, setTokenCookie)
  .get('/google', getAuthGoogle);

router.post('/login', postAuthLogin.handlers, sendAuthToken);

router.post('/signup', postAuthSignup.handlers, sendAuthToken);

router.post('/confirmation', postAuthConfirmation);

// Do we need this?
//  - we have a password change
//  - we have a password reset
// ? else
router.get('/password', isAuthenticated, getAuthResetPassRequest);

router.patch(
  '/password/change',
  isAuthenticated,
  patchAuthChangePassword.handlers,
  sendAuthToken,
);

router.patch('/password/reset', patchAuthResetPassword.handlers, sendAuthToken);

router.post('/password', postAuthPassword.handlers);

router.get('/token/:tokenString', isAuthenticated, getAuthToken);

router.get('/', isAuthenticated, getAuthRoot);

router.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default router;
