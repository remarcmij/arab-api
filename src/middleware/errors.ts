import { ErrorRequestHandler } from 'express';
import i18next from 'i18next';
import logger from '../config/logger';
import { isSystemError, AppError } from '../util';

export const sysErrorsHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next,
) => {
  logger.error(`${error.name}: ${error.logMsg ?? error.message}`);

  if (isSystemError(error)) {
    return void res.status(500).json({ message: i18next.t('server_error') });
  }

  if (error instanceof AppError) {
    return void next(error);
  }

  // handling any unexpected library/system errors.
  res.status(500).json({ message: i18next.t('server_error') });
};

export const userErrorsHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  const status: number = error.status ?? 500;
  res.status(status).json({ message: error.message ?? error.logMsg });
};
