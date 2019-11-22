import _assert from 'assert';
import util from 'util';

// TS.
declare module 'util' {
  function getSystemErrorName(errno: number): string;
}

export class AppError extends Error {
  name = 'AppError';
}

// JS.
export function assertIsString(val: unknown): asserts val is string {
  _assert(typeof val === 'string', 'Expected a string!');
}

export const isSystemError = (error: Error & { errno?: number }) => {
  let hasSystemErrorName = false;
  if (error.errno) {
    try {
      const errorName = util.getSystemErrorName(error.errno);
      // system errors doesn't have spaces in their code names!
      // so if there is a space it's gonna be out of 'Unknown system error <negative-number>'
      hasSystemErrorName = / [^ ]/.test(errorName);
    } catch (error) {
      /* error thrown? then it's not a system error!. */
    }
  }
  return hasSystemErrorName;
};
