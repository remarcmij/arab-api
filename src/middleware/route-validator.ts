import locales from '../locales/en/server.json';
import { check, body, validationResult } from 'express-validator';
import i18next from 'i18next';
import { RequestHandler } from 'express';

// TS.
type LocaleKeys = keyof typeof locales;

// JS.
export const handleRequestErrors: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors.array());
  }
  next();
};

export const validateRouteBody = (
  fields?: string,
  i18nextKey?: LocaleKeys,
  i18nextOptions?: object,
) => body(fields, i18nextKey && i18next.t(i18nextKey, i18nextOptions));

export const checkRequiredFields = (...args: any) => {
  return check(...args)
    .not()
    .isEmpty();
};
