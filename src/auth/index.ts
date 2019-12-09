import express, { Request, Response } from 'express';
import {
  getAuthGoogle,
  getAuthGoogleCallback,
  getAuthRoot,
  postAuthConfirmation,
  postAuthLogin,
  postAuthLoginChecks,
  postAuthSignupChecks,
  postAuthSignup,
  getAuthToken,
  getAuthResetPassRequest,
  postAuthPassword,
  postAuthPasswordChecks,
} from './endpoints';
import { isAuthenticated, sendAuthToken, setTokenCookie } from './services';
import './google/passport-setup';

const router = express.Router();

router
  .get('/google/callback', getAuthGoogleCallback, setTokenCookie)
  .get('/google', getAuthGoogle);

router.post('/login', postAuthLoginChecks, postAuthLogin, sendAuthToken);

router.post('/signup', postAuthSignupChecks, postAuthSignup, sendAuthToken);

router.post('/confirmation', postAuthConfirmation);

router.get('/password', isAuthenticated, getAuthResetPassRequest);

// todo: make this a `patch request`.
router.post(
  '/password/:tokenString',
  isAuthenticated,
  postAuthPasswordChecks,
  postAuthPassword,
  sendAuthToken,
);

// * password forgotten.
router.post('/password', () => {
  /* do something. */
});

router.get('/token/:tokenString', isAuthenticated, getAuthToken);

router.get('/', isAuthenticated, getAuthRoot);

router.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default router;
