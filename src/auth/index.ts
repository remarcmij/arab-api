import {
  getAuthGoogle,
  getAuthGoogleCallback,
  getAuthRoot,
  postAuthConfirmation,
  postAuthLogin,
  postAuthLoginChecks,
  postAuthSignupChecks,
  postAuthSignup,
} from './endpoints';
import express, { Request, Response } from 'express';
import { isAuthenticated, sendAuthToken, setTokenCookie } from './services';
import './google/passport-setup';

const router = express.Router();

router
  .get('/google/callback', getAuthGoogleCallback, setTokenCookie)
  .get('/google', getAuthGoogle);

router.post('/login', postAuthLoginChecks, postAuthLogin, sendAuthToken);

router.post('/signup', postAuthSignupChecks, postAuthSignup, sendAuthToken);

router.post('/confirmation', postAuthConfirmation);

router.get('/', isAuthenticated, getAuthRoot);

router.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default router;
