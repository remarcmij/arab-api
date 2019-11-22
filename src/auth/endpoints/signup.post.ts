import sgMail from '@sendgrid/mail';
import { RequestHandler } from 'express';
import { sanitizeBody } from 'express-validator/filter';
import i18next from 'i18next';
import jwt from 'jsonwebtoken';
import _template from 'lodash.template';
import User, { encryptPassword, IUser } from '../../models/User';
import logger from '../../config/logger';
import { assertIsString } from '../../util';
import { validateRouteBody } from '../../middleware/route-validator';
import emailTemplate from '../templates/confirmation';
import { handleRequestErrors } from '../../middleware/route-validator';

const compiledTemplate = _template(emailTemplate);
const PASSWORD_MIN_LENGTH = 8;

export const postAuthSignupChecks = [
  validateRouteBody('name', 'user_name_required')
    .not()
    .isEmpty(),
  validateRouteBody('email', 'email_required').isEmail(),
  sanitizeBody('email').normalizeEmail(),
  validateRouteBody('password', 'password_min_length', {
    minLength: PASSWORD_MIN_LENGTH,
  }).isLength({
    min: PASSWORD_MIN_LENGTH,
  }),
  handleRequestErrors,
];

export const postAuthSignup: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ message: i18next.t('email_already_registered') });
    }

    const hashedPassword = await encryptPassword(password);
    const newUser: IUser = {
      name,
      email,
      password: hashedPassword,
    };
    user = await User.create(newUser);
    req.user = user;

    const payload = {
      user: {
        id: user.id,
      },
    };

    assertIsString(process.env.CONFIRMATION_SECRET);
    const confirmationSecret = process.env.CONFIRMATION_SECRET;
    const token = await jwt.sign(payload, confirmationSecret!, {
      expiresIn: '12h',
    });

    // Check if not token
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const link =
      process.env.NODE_ENV === 'production'
        ? `https://${req.headers.host}/confirmation/${token}`
        : `http://localhost:3000/confirmation/${token}`;

    const subject = req.t('verification_email.subject');
    const values: object = req.t('verification_email.body', {
      returnObjects: true,
      name,
    });
    const html = compiledTemplate({ link, ...values });

    const msg = {
      from: 'noreply@taalmap.nl',
      to: user.email,
      subject,
      html,
    };

    assertIsString(process.env.SENDGRID_API_KEY);
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send(msg);
    logger.debug(`A verification email has been sent to ${user!.email}.`);
    next();
  } catch (err) {
    logger.error(err.message);
  }
};
