import _assert from 'assert';
import util from 'util';

// TS.
declare module 'util' {
  function getSystemErrorName(errno: number): string;
}

export class AppError extends Error {}

export interface IApiError extends Error {
  status: number;
  error?: Error | null;
  logger?: null | {
    level: 'debug' | 'warn' | 'error';
    message: string;
  };
}

// JS.
export function assertIsString(val: unknown): asserts val is string {
  _assert(typeof val === 'string', 'Expected a string!');
}

/**
 *
 * Usage @example:
 * ```
 *  const e = new Error('message')
 *  const apiErrorObject = new ApiError(e)
 *  apiErrorObject.logger  // { message: 'message', level: 'error' }
 *  apiErrorObject.message // 'message'
 *  apiErrorObject.error   // Error Object
 *  apiErrorObject.status  // 500
 * ```
 *
 * Usage @example:
 * ```
 *  const e = new Error('message')
 *  const apiErrorObject = new ApiError(e, { message: 'what ever', level: 'debug' })
 *  apiErrorObject.logger  // { message: 'what ever', level: 'debug' }
 *  apiErrorObject.message // 'message'
 *  apiErrorObject.error   // Error Object
 *  apiErrorObject.status  // 500
 * ```
 *
 * Usage @example:
 * ```
 *  const e = new Error('message')
 *  const apiErrorObject = new ApiError(404, e, { message: 'what ever', level: 'debug' })
 *  apiErrorObject.logger  // { message: 'what ever', level: 'debug' }
 *  apiErrorObject.message // 'message'
 *  apiErrorObject.error   // Error Object
 *  apiErrorObject.status  // 404
 * ```
 *
 * Usage @example:
 * ```
 *  const e = new Error('message')
 *  const apiErrorObject = new ApiError(404, e)
 *  apiErrorObject.logger  // null
 *  apiErrorObject.message // 'message'
 *  apiErrorObject.error   // Error Object
 *  apiErrorObject.status  // 404
 * ```
 *
 * Usage @example:
 * ```
 *  const apiErrorObject = new ApiError(404, { message: 'what ever', level: 'debug' })
 *  apiErrorObject.logger  // { message: 'what ever', level: 'debug' }
 *  apiErrorObject.message // 'what ever'
 *  apiErrorObject.error   // null
 *  apiErrorObject.status  // 404
 * ```
 *
 * Usage @example:
 * ```
 *  const apiErrorObject = new ApiError(404, 'message')
 *  apiErrorObject.logger  // null
 *  apiErrorObject.message // 'message'
 *  apiErrorObject.error   // null
 *  apiErrorObject.status  // 404
 * ```
 *
 * Usage @example:
 * ```
 *  const apiErrorObject = new ApiError(404, 'message', { message: 'what ever', level: 'error' })
 *  apiErrorObject.logger  // { message: 'what ever', level: 'error' }
 *  apiErrorObject.message // 'message'
 *  apiErrorObject.error   // null
 *  apiErrorObject.status  // 404
 * ```
 */
export class ApiError extends Error implements IApiError {
  public status: number;
  public message: string;
  public logger: IApiError['logger'] | null;
  public error?: Error | null;

  constructor(error: Error);
  constructor(error: Error, logger: IApiError['logger']);
  constructor(status: number, error: Error);
  constructor(status: number, error: Error, logger: IApiError['logger']);
  constructor(status: number, logger: IApiError['logger']);
  constructor(status: number, message: string);
  constructor(status: number, message: string, logger: IApiError['logger']);
  constructor(
    x: number | Error,
    y?: string | Error | IApiError['logger'],
    z?: IApiError['logger'],
  ) {
    if (typeof x === 'number') {
      super(typeof y === 'string' ? y : undefined);
      this.status = x;
      this.error = y instanceof Error ? y : null;

      if (this.error) {
        super.name = this.error.name;
        super.stack = this.error.stack;
      }

      const alternateErrorMessage = this.error ? this.error.message : '';
      this.message = typeof y === 'string' ? y : alternateErrorMessage;

      // still no message?
      if (!this.message) {
        if (typeof y === 'object' && y?.message) {
          this.message = y?.message;
        }
      }

      if (typeof y === 'object' && y != null) {
        if ('message' in y && 'level' in y) {
          this.logger = y;
        }
      }
    } else {
      super(x.message);
      super.name = x.name;
      super.stack = x.stack;

      this.message = x.message;
      this.error = x;

      if (!z && typeof y !== 'object') {
        z = { message: x.message, level: 'error' };
      } else {
        z = y as IApiError['logger'];
      }

      this.status = 500;
    }

    if (z && z.level && z.message) {
      this.logger = z;
    } else {
      this.logger = null;
    }
  }
}

export const isSystemError = (error: Error & { errno?: number }) => {
  let hasSystemErrorName = false;
  if (error.errno) {
    try {
      const errorName = util.getSystemErrorName(error.errno);
      // system errors doesn't have spaces in their code names!
      // so if there is a space it's gonna be out of 'Unknown system error <negative-number>'
      hasSystemErrorName = !/[^ ]/.test(errorName);
    } catch (error) {
      /* error thrown? then it's not a system error!. */
    }
  }
  return hasSystemErrorName;
};
