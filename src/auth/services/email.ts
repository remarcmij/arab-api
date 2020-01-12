import sgMail from '@sendgrid/mail';
import i18next from 'i18next';
import _template from 'lodash.template';
import { assertIsString } from '../../util';

export type MailOptionTypes =
  | 'verification'
  | 'password_reset'
  | 'user_verified';

type MailOptions = {
  email: string;
  name: string;
  type: MailOptionTypes;
  emailTemplate: string;
  mainButtonLink?: string;
};

export const sendTemplateMail = async (mailOptions: MailOptions) => {
  const { email, emailTemplate, type, mainButtonLink, name } = mailOptions;
  const compiledTemplate = _template(emailTemplate);

  const link = mainButtonLink;

  const subject = i18next.t(`${type}_email.subject`);
  const values: object = i18next.t(`${type}_email.body`, {
    returnObjects: true,
    name,
  });
  const html = compiledTemplate({ link, ...values });

  const msg = {
    from: 'noreply@taalmap.nl',
    to: email,
    subject,
    html,
  };

  assertIsString(process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send(msg);
};
