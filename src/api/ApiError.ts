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

export class ApiError extends AppError {
  public readonly status!: number;
  public readonly logMsg?: string;
  private readonly _next?: NextFunction;

  constructor(params: IApiErrorParams);
  constructor(next: NextFunction, ...args: any);

  constructor(paramsORNext: IApiErrorParams | NextFunction, ...args: any) {
    if (typeof paramsORNext === 'function') {
      super();
      this._next = paramsORNext.bind(paramsORNext, ...args);
      return;
    }
    const { status, i18nKey, logMsg, error } = {
      ...defaultParams,
      ...paramsORNext,
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

  static passNext(next: NextFunction, params: IApiErrorParams) {
    const e = new ApiError(params);
    return next(e), e;
  }

  public passToNext(params: IApiErrorParams) {
    return void ApiError.passNext(this._next!, params);
  }
}
