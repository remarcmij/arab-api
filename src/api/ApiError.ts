import i18next from 'i18next';
import locales from '../locales/en/server.json';
import { AppError } from '../util';
import { NextFunction } from 'express';

type LocaleKeys = keyof typeof locales;

type IApiErrorParams = {
  status: number;
  i18nKey?: LocaleKeys;
  logMsg?: string;
  error?: Error | null;
};

const defaultParams = {
  status: 500,
  message: 'server_error',
  error: null,
};

class ApiError extends AppError {
  public readonly status!: number;
  public readonly logMsg?: string;

  constructor(params: IApiErrorParams) {
    const { status, i18nKey, logMsg, error } = {
      ...defaultParams,
      ...params,
    };
    if (error) {
      super(error.message);
      this.stack = error.stack;
    } else {
      super(i18next.t(i18nKey ?? 'server_error'));
    }
    this.logMsg = logMsg;
    this.status = status;
    this.name = 'ApiError';
  }
}

type ErrorHandler = (params: IApiErrorParams) => void;

export const withError = (next: NextFunction, ...args: any): ErrorHandler => {
  return function(params) {
    return next(...args, new ApiError(params));
  };
};
