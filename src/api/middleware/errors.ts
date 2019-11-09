import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import logger from '../../config/logger';
import { IApiError, isSystemError } from '../../util';
import i18next from 'i18next';

export const sysErrorsHandler =
  (error: ErrorRequestHandler & IApiError, req: Request, res: Response, next: NextFunction) => {

    if (error.logger) {
      const loggerLevel = error.logger.level;
      logger[loggerLevel!](error.logger);
    }

    const hasSysError = isSystemError(error);
    if (error.error instanceof Error) {
      if (hasSysError) {
        return void res.status(500).json({ message: i18next.t('server_error') });
      }
    }

    if (!error.status) {
      return void res.status(500).json({ message: i18next.t('unexpected_error') });
    }

    if (!error.status && !hasSysError) {
      logger.error('Unexpected development error, please report via Github.');
      return void res.status(500).json({ message: i18next.t('unexpected_error') });
    }

    if (!hasSysError && error.status > 100 && error.status < 500) {
      return void next(error);
    }

    // handling any unexpected library/system errors.
    res.status(500).json({ message: i18next.t('server_error') });
  };

export const userErrorsHandler =
  (error: ErrorRequestHandler & IApiError, req: Request, res: Response) => {
    const errorMessage = i18next.t(error.message) || i18next.t('unknown_error');
    return void res.status(error.status).json({ message: errorMessage });
  };
