import sgMail from '@sendgrid/mail';
import { IUser } from '../../models/User';
import { assertIsString } from '../../util';

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