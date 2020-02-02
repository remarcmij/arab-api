import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { assertIsString } from '../../util';
import {
  generateConfirmationToken,
  MailOptionTypes,
  sendTemplateMail,
} from '../services';
import emailTemplate from '../templates/confirmation';

const inDevelopmentMode = () => {
  return process.env?.NODE_ENV === 'development';
};

// helpers.
const generateClientLink = (link: string, host = '') => {
  return process.env.NODE_ENV === 'production'
    ? `https://${host}/${link.replace(/^\/+/, '')}`
    : `http://localhost:3000/${link.replace(/^\/+/, '')}`;
};

// Confirmation token helper:
export const emailConfirmationToken = async (
  req: Request,
  options: { type: MailOptionTypes; clientPath: string; expiresIn?: string },
) => {
  const token = await generateConfirmationToken(req, options.expiresIn);

  const link = generateClientLink(
    `/${options.clientPath}/${token}`,
    req.headers.host,
  );

  if (inDevelopmentMode()) {
    return console.log(link);
  }

  await sendTemplateMail({
    email: req.user?.email as string,
    emailTemplate,
    name: req.user?.name as string,
    type: options.type,
    mainButtonLink: link,
  });
};

export const emailResetToken = async (
  req: Request,
  options: { clientPath: string; expiresIn?: string },
) => {
  assertIsString(process.env.RESET_SECRET);
  const token = jwt.sign({ id: req.user!.id }, process.env.RESET_SECRET, {
    expiresIn: options.expiresIn,
  });

  const link = generateClientLink(
    `/${options.clientPath}/${token}`,
    req.headers.host,
  );

  if (inDevelopmentMode()) {
    return console.log(link);
  }

  await sendTemplateMail({
    email: req.user!.email,
    emailTemplate,
    name: req.user?.name as string,
    type: 'password_reset',
    mainButtonLink: link,
  });
};

export const emailForUserAuthorization = async (
  req: Request,
  options: { clientPath: string; name: string },
) => {
  const link = generateClientLink(`/${options.clientPath}`, req.headers.host);

  if (inDevelopmentMode()) {
    return console.log(link);
  }

  assertIsString(process.env.OWNER_EMAIL);
  await sendTemplateMail({
    email: process.env.OWNER_EMAIL!,
    emailTemplate,
    name: options.name,
    type: 'user_verified',
    mainButtonLink: link,
  });
};
