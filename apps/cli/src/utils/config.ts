import fs from 'node:fs/promises';
import path from 'node:path';
import type { EnvctrlConfig } from '@envctrl/types';

/**
 * Returns the absolute path to the envctrl config file.
 *
 * @param cwd - Base directory (typically the project root).
 * @param dir - Config directory name relative to `cwd`. Defaults to `.envctrl`.
 * @param file - Config file name inside `dir`. Defaults to `config.json`.
 */
export function resolveConfigPath(
  cwd: string,
  dir = '.envctrl',
  file = 'config.json',
): string {
  return path.join(cwd, dir, file);
}

/**
 * Reads and parses the envctrl config file.
 * Returns `null` when the file does not exist or cannot be parsed.
 *
 * @param cwd - Base directory (typically the project root).
 * @param dir - Config directory name relative to `cwd`. Defaults to `.envctrl`.
 * @param file - Config file name inside `dir`. Defaults to `config.json`.
 */
export async function readConfig(
  cwd: string,
  dir = '.envctrl',
  file = 'config.json',
): Promise<EnvctrlConfig | null> {
  try {
    const raw = await fs.readFile(resolveConfigPath(cwd, dir, file), 'utf8');
    return JSON.parse(raw) as EnvctrlConfig;
  } catch {
    return null;
  }
}

/**
 * Writes `config` as JSON, creating the config directory if needed.
 *
 * @param cwd - Base directory (typically the project root).
 * @param config - Configuration object to persist.
 * @param dir - Config directory name relative to `cwd`. Defaults to `.envctrl`.
 * @param file - Config file name inside `dir`. Defaults to `config.json`.
 * @returns The absolute path of the written file.
 */
export async function writeConfig(
  cwd: string,
  config: EnvctrlConfig,
  dir = '.envctrl',
  file = 'config.json',
): Promise<string> {
  const configDir = path.join(cwd, dir);
  await fs.mkdir(configDir, { recursive: true });
  const configPath = resolveConfigPath(cwd, dir, file);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  return configPath;
}
