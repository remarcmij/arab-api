import { NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { withError } from '../../api/ApiError';
import { assertIsString, consoleOnDevelopment } from '../../util';
import {
  generateConfirmationToken,
  MailOptionTypes,
  sendTemplateMail,
} from '../services';
import emailTemplate from '../templates/confirmation';

// helpers.
const generateClientLink = (link: string, host = '') => {
  return process.env.NODE_ENV === 'production'
    ? `https://${host}/${link.replace(/^\/+/, '')}`
    : `http://localhost:3000/${link.replace(/^\/+/, '')}`;
};

// Confirmation token helper:
export const emailConfirmationToken = async (
  req: Request,
  next: NextFunction,
  options: { type: MailOptionTypes; clientPath: string; expiresIn?: string },
) => {
  const token = await generateConfirmationToken(req, options.expiresIn);

  // Check if not token
  if (!token) {
    return withError(next)({
      status: 401,
      i18nKey: 'empty_login_token',
      logMsg: `No token registered while (${req.user?.email}) ${options.type} request.`,
    });
  }

  const link = generateClientLink(
    `/${options.clientPath}/${token}`,
    req.headers.host,
  );

  await consoleOnDevelopment(
    () => link,
    async () =>
      await sendTemplateMail({
        email: req.user?.email as string,
        emailTemplate,
        name: req.user?.name as string,
        type: options.type,
        mainButtonLink: link,
      }),
  );
};

// Custom login token helper:
export const emailResetToken = async (
  req: Request,
  next: NextFunction,
  options: { clientPath: string; expiresIn?: string },
) => {
  assertIsString(process.env.RESET_SECRET);
  const token = jwt.sign(
    { id: req.user!.id },
    process.env.RESET_SECRET,
    {
      expiresIn: options.expiresIn,
    },
  );

  // Check if not token
  if (!token) {
    return withError(next)({
      status: 401,
      i18nKey: 'empty_login_token',
      logMsg: `No token registered while (${req.user?.email}) password reset request.`,
    });
  }

  const link = generateClientLink(
    `/${options.clientPath}/${token}`,
    req.headers.host,
  );

  await consoleOnDevelopment(
    () => link,
    async () =>
      await sendTemplateMail({
        email: req.user?.email as string,
        emailTemplate,
        name: req.user?.name as string,
        type: 'password-reset',
        mainButtonLink: link,
      }),
  );
};
