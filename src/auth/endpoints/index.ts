import { NextFunction, Request } from 'express';
import { withError } from '../../api/ApiError';
import { consoleOnDevelopment } from '../../util';
import {
  generateConfirmationToken,
  MailOptionTypes,
  sendTemplateMail,
  signToken,
} from '../services';
import emailTemplate from '../templates/confirmation';

export * from './confirmation.post';
export * from './google.get';
export * from './login.post';
export * from './password.get';
export * from './password.patch';
export * from './password.post';
export * from './root.get';
export * from './signup.post';
export * from './token.get';
export * from './validationChecks';

// helpers.

// Confirmation token helper:
export const sendConfirmationToken = async (
  req: Request,
  next: NextFunction,
  _options: { type: MailOptionTypes; clientPath: string; expiresIn?: string },
) => {
  const token = await generateConfirmationToken(req, _options.expiresIn);

  // Check if not token
  if (!token) {
    return withError(next)({
      status: 401,
      i18nKey: 'empty_login_token',
      logMsg: `No token registered while (${req.user?.email}) ${_options.type} request.`,
    });
  }

  const link = req.clientLinkGenerator(`/${_options.clientPath}/${token}`);

  await consoleOnDevelopment(
    () => link,
    async () =>
      await sendTemplateMail({
        email: req.user?.email as string,
        emailTemplate,
        name: req.user?.name as string,
        type: _options.type,
        mainButtonLink: link,
      }),
  );
};

// Custom login token helper:
export const sendCustomLoginToken = async (
  req: Request,
  next: NextFunction,
  _options: { type: MailOptionTypes; clientPath: string; expiresIn?: string },
) => {
  const token = signToken(req.user?.id, _options.expiresIn);

  // Check if not token
  if (!token) {
    return withError(next)({
      status: 401,
      i18nKey: 'empty_login_token',
      logMsg: `No token registered while (${req.user?.email}) ${_options.type} request.`,
    });
  }

  const link = req.clientLinkGenerator(`/${_options.clientPath}/${token}`);

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
