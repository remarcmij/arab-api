import assert from 'assert';

export function assertEnvVar(name: string) {
  assert(process.env[name], `${name} environment variable is required`);
}
