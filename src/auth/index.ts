import express, { Request, Response } from 'express';
import {
  googleGet,
  googleCallbackGet,
  rootGet,
  tokenGet,
  changePasswordPatch,
  resetPasswordPatch,
  confirmationPost,
  loginPost,
  passwordPost,
  signupPost,
  setPasswordPatch,
} from './endpoints';
import googlePassportSetup from './google/passport-setup';
import { isAuthenticated, sendAuthToken, setTokenCookie } from './services';

const router = express.Router();

router.use(googlePassportSetup);

router
  .get('/google/callback', googleCallbackGet, setTokenCookie)
  .get('/google', googleGet);

router.post('/login', loginPost.handlers, sendAuthToken);

router.post('/signup', signupPost.handlers, sendAuthToken);

router.post('/confirmation', confirmationPost);

router.patch(
  '/password/change',
  isAuthenticated,
  changePasswordPatch.handlers,
  sendAuthToken,
);

router.patch('/password/reset', resetPasswordPatch.handlers, sendAuthToken);

router.patch(
  '/password/set',
  isAuthenticated,
  setPasswordPatch.handlers,
  sendAuthToken,
);

router.post('/password', passwordPost.handlers);

router.get('/token/:tokenString', isAuthenticated, tokenGet);

router.get('/', isAuthenticated, rootGet);

router.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default router;
