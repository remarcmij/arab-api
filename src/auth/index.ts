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
  postAuthEmailChecks,
  postAuthLogin,
  postAuthLoginChecks,
  postAuthPassword,
  postAuthSignup,
  postAuthSignupChecks,
} from './endpoints';
import './google/passport-setup';
import { isAuthenticated, sendAuthToken, setTokenCookie } from './services';

const router = express.Router();

router
  .get('/google/callback', getAuthGoogleCallback, setTokenCookie)
  .get('/google', getAuthGoogle);

router.post('/login', postAuthLoginChecks, postAuthLogin, sendAuthToken);

router.post('/signup', postAuthSignupChecks, postAuthSignup, sendAuthToken);

router.post('/confirmation', postAuthConfirmation);

router.get('/password', isAuthenticated, getAuthResetPassRequest);

router.patch(
  '/password/change',
  isAuthenticated,
  patchAuthChangePassword.handlers,
  sendAuthToken,
);

router.patch('/password/reset', patchAuthResetPassword.handlers, sendAuthToken);

router.post('/password', postAuthEmailChecks, postAuthPassword);

router.get('/token/:tokenString', isAuthenticated, getAuthToken);

router.get('/', isAuthenticated, getAuthRoot);

router.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default router;
