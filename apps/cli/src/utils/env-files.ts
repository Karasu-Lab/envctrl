import path from 'node:path';
import type { EnvFilePair, EnvironmentName } from '@envctrl/types';

const RESERVED_ENV_NAMES = new Set(['keys', 'example']);

/**
 * Derives the environment name from a `.env.*` filename, stripping `.unencrypted`
 * and `.local` suffixes. Returns `undefined` for reserved filenames like
 * `.env.keys` and `.env.example`.
 */
export function parseEnvironmentFromFilename(filename: string): EnvironmentName | undefined {
  const base = path.basename(filename);

  if (!base.startsWith('.env.')) {
    return undefined;
  }

  const withoutPrefix = base.slice('.env.'.length);

  if (!withoutPrefix || RESERVED_ENV_NAMES.has(withoutPrefix)) {
    return undefined;
  }

  let name = withoutPrefix.endsWith('.unencrypted')
    ? withoutPrefix.slice(0, -'.unencrypted'.length)
    : withoutPrefix;

  if (name.endsWith('.local')) {
    name = name.slice(0, -'.local'.length);
  }

  if (!name || RESERVED_ENV_NAMES.has(name)) {
    return undefined;
  }

  return name;
}

/**
 * Builds the {@link EnvFilePair} for a given environment name and working directory.
 *
 * @param environment - The environment name, e.g. `"production"`
 * @param cwd - The working directory that will contain the env files
 */
export function buildEnvFilePair(environment: EnvironmentName, cwd: string): EnvFilePair {
  return {
    environment,
    unencrypted: path.resolve(cwd, `.env.${environment}.unencrypted`),
    encrypted: path.resolve(cwd, `.env.${environment}`),
  };
}

/**
 * Parses KEY=VALUE pairs from a plaintext `.env` file string.
 *
 * Skips blank lines and comment lines starting with `#`.
 *
 * @param content - Raw file content
 */
export function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }

  return result;
}

/**
 * Writes or updates a single `KEY=VALUE` line in a plaintext env file string.
 *
 * If the key already exists its line is replaced in-place; otherwise the
 * entry is appended.
 *
 * @param content - Current raw file content
 * @param key - The environment variable name
 * @param value - The new value
 */
export function upsertEnvLine(content: string, key: string, value: string): string {
  const lines = content.split('\n');
  const pattern = new RegExp(`^${key}\\s*=`);
  let replaced = false;

  const updated = lines.map((line) => {
    if (pattern.test(line)) {
      replaced = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!replaced) {
    if (updated[updated.length - 1] !== '') {
      updated.push(`${key}=${value}`);
    } else {
      updated.splice(updated.length - 1, 0, `${key}=${value}`);
    }
  }

  return updated.join('\n');
}
