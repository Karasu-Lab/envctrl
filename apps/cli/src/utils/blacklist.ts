import fs from 'node:fs/promises';
import path from 'node:path';
import type { EnvironmentName } from '@envctrl/types';
import { resolveBlacklistPath } from './platform.js';

/** Reads the blacklist from disk, returning an empty array if it does not exist. */
export async function readBlacklist(): Promise<EnvironmentName[]> {
  try {
    const raw = await fs.readFile(resolveBlacklistPath(), 'utf8');
    return JSON.parse(raw) as EnvironmentName[];
  } catch {
    return [];
  }
}

/** Writes the blacklist to disk. */
export async function writeBlacklist(entries: EnvironmentName[]): Promise<void> {
  const filePath = resolveBlacklistPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(entries, null, 2) + '\n', 'utf8');
}
