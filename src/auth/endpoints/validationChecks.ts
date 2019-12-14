import { sanitizeBody } from 'express-validator';
import {
  handleRequestErrors,
  validateRouteBody,
} from '../../middleware/route-validator';

const PASSWORD_MIN_LENGTH = 8;

// Routes checks.
export const patchAuthPasswordChecks = [
  validateRouteBody('password', 'password_min_length', {
    minLength: PASSWORD_MIN_LENGTH,
  }).isLength({
    min: PASSWORD_MIN_LENGTH,
  }),
  handleRequestErrors,
];

export const postAuthEmailChecks = [
  validateRouteBody('email', 'email_required').isEmail(),
  sanitizeBody('email').normalizeEmail(),
  handleRequestErrors,
];

export const postAuthSignupChecks = [
  validateRouteBody('name', 'user_name_required')
    .not()
    .isEmpty(),
  ...postAuthEmailChecks,
  ...patchAuthPasswordChecks,
];

export const postAuthLoginChecks = [
  validateRouteBody('email', 'email_required').isEmail(),
  sanitizeBody('email').normalizeEmail(),
  validateRouteBody('password', 'password_required')
    .not()
    .isEmpty(),
  handleRequestErrors,
];
