import { createRequire } from 'node:module';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as dotenvx from '@dotenvx/dotenvx';
import type { DotenvxEncryptResult, DotenvxSetResult } from '@envctrl/types';

const execFileAsync = promisify(execFile);

/**
 * Resolves the path to the dotenvx CLI entry script from the installed package.
 *
 * Reads the `bin` field from the package's own `package.json` to avoid
 * hardcoding the path, which can change across dotenvx versions.
 */
function resolveDotenvxBin(): string {
  const require = createRequire(import.meta.url);
  const pkgJsonPath = require.resolve('@dotenvx/dotenvx/package.json');
  const pkgJson = require('@dotenvx/dotenvx/package.json') as {
    bin: Record<string, string>;
  };
  const binRelPath = pkgJson.bin['dotenvx'];
  return path.resolve(path.dirname(pkgJsonPath), binRelPath);
}

/**
 * Sets a single key-value pair in an encrypted env file using the dotenvx JS API.
 *
 * @param key - The environment variable name
 * @param value - The value to set
 * @param encryptedFilePath - Absolute path to the target `.env.[env]` file
 * @param keysFilePath - Optional path to the `.env.keys` file
 */
export function setKeyValue(
  key: string,
  value: string,
  encryptedFilePath: string,
  keysFilePath?: string,
): DotenvxSetResult {
  const output = dotenvx.set(key, value, {
    path: encryptedFilePath,
    encrypt: true,
    ...(keysFilePath ? { envKeysFile: keysFilePath } : {}),
  });

  return {
    changedFilepaths: output.changedFilepaths,
    unchangedFilepaths: output.unchangedFilepaths,
  };
}

/**
 * Encrypts an existing plaintext env file in-place using the dotenvx CLI.
 *
 * Spawns the bundled `dotenvx encrypt -f <filePath>` process. The CLI
 * handles creating or updating the corresponding `.env.keys` entry.
 *
 * @param filePath - Absolute path to the plaintext `.env.*` file to encrypt
 */
export async function encryptFile(filePath: string): Promise<DotenvxEncryptResult> {
  const bin = resolveDotenvxBin();
  await execFileAsync(process.execPath, [bin, 'encrypt', '-f', filePath]);

  return {
    changedFilepaths: [filePath],
    unchangedFilepaths: [],
  };
}

/**
 * Lists env files in a directory using the dotenvx JS API.
 *
 * @param directory - Directory to scan
 * @param include - Glob pattern(s) to include
 * @param exclude - Glob pattern(s) to exclude
 */
export function listEnvFiles(
  directory: string,
  include: string | string[],
  exclude: string | string[],
): string[] {
  return dotenvx.ls(directory, include, exclude);
}
