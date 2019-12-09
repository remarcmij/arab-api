import sgMail from '@sendgrid/mail';
import { IUser } from '../../models/User';
import { assertIsString } from '../../util';
import _template from 'lodash.template';
import i18next from 'i18next';

type MailOptionTypes = 'verification' | 'password-reset';

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

// TODO: send an email to the admin when an account is
// verified so that it can be considered for authorization.
// Email content to be revised.
export const sendMail = (user: IUser) => {
  assertIsString(process.env.SENDGRID_API_KEY);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  /* cSpell: disable */
  const msg = {
    // to: process.env.ADMIN_EMAIL,
    to: 'remarcmij@gmail.com',
    from: 'noreply@studiehulp-arabisch.nl',
    subject: 'Nieuwe Studiehulp Arabisch gebruiker',
    text: 'and easy to do anywhere, even with Node.js',
    html: '<strong>and easy to do anywhere, even with Node.js</strong>',
  };
  /* cSpell: enable */
  console.log('msg :', msg);
  console.log('user :', user);
  return sgMail.send(msg);
};
