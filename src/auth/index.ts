import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import i18n from 'i18next';
import { handleRequestErrors } from '../middleware/route-validator';
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

const PASSWORD_MIN_LENGTH = 8;

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
  [
    body(
      'password',
      i18n.t('password_min_length', { minLength: PASSWORD_MIN_LENGTH }),
    ).isLength({ min: PASSWORD_MIN_LENGTH }),
    body('currentPassword', i18n.t('current_password_required'))
      .not()
      .isEmpty(),
  ],
  handleRequestErrors,
  patchAuthChangePassword,
  sendAuthToken,
);

router.patch(
  '/password/reset',
  [
    body('resetToken', i18n.t('reset_token_required'))
      .not()
      .isEmpty(),
    body(
      'password',
      i18n.t('password_min_length', { minLength: PASSWORD_MIN_LENGTH }),
    ).isLength({ min: PASSWORD_MIN_LENGTH }),
  ],
  handleRequestErrors,
  patchAuthResetPassword,
  sendAuthToken,
);

router.post('/password', postAuthEmailChecks, postAuthPassword);

router.get('/token/:tokenString', isAuthenticated, getAuthToken);

router.get('/', isAuthenticated, getAuthRoot);

router.use('*', (req: Request, res: Response) => res.sendStatus(404));

export default router;
