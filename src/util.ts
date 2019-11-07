import _assert from 'assert';

export function assertIsString(val: unknown): asserts val is string {
  _assert(typeof val === 'string', 'Expected a string!');
}
