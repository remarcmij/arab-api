import emailTemplate from '../templates/confirmation';
import { generateConfirmationToken, sendTemplateMail } from '../services';
import { Request, NextFunction } from 'express';
import { withError } from '../../api/ApiError';

export * from './google.get';
export * from './root.get';
export * from './token.get';
export * from './confirmation.post';
export * from './login.post';
export * from './signup.post';

// helpers.

// Confirmation token helper:
export const sendConfirmationToken = async (req: Request, next: NextFunction) => {
  const token = await generateConfirmationToken(req);

  // Check if not token
  if (!token) {
    return withError(next)({
      status: 401,
      i18nKey: 'empty_login_token',
      logMsg: `No token registered while (${req.user?.email}) signup request.`,
    });
  }

  const link = req.clientLinkGenerator(`/confirmation/${token}`)

  await sendTemplateMail({
    email: req.user?.email as string,
    emailTemplate,
    name: req.user?.name as string,
    type: 'verification',
    mainButtonLink: link,
  });
}
