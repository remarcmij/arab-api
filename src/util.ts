import _assert from 'assert';

export function assertIsString(val: any): asserts val is string {
  _assert(typeof val === 'string', 'Expected a string!');
}
