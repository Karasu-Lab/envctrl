import fs from 'node:fs/promises';
import type { CommandContext, CommandResult, ISubCommand, KeystoreEntry } from '@envctrl/types';
import { resolveKeystoresRegistryPath } from '../../utils/platform.js';
import { readRegistry, writeRegistry } from './registry.js';

/** Options parsed by Commander for `keystore delete`. */
export interface KeystoreDeleteOptions {
  name: string;
  force: boolean;
}

/**
 * Deletes a named keystore directory and removes its entry from the registry.
 *
 * Requires `--force` flag to skip the confirmation guard. Without it,
 * the command exits early with a descriptive error.
 */
export class KeystoreDeleteSubCommand implements ISubCommand<KeystoreDeleteOptions, KeystoreEntry> {
  /** @inheritdoc */
  async execute(
    options: KeystoreDeleteOptions,
    _context: CommandContext,
  ): Promise<CommandResult<KeystoreEntry>> {
    const { name, force } = options;

    try {
      const registryPath = resolveKeystoresRegistryPath();
      const registry = await readRegistry(registryPath);
      const entry = registry.find((e) => e.name === name);

      if (!entry) {
        return {
          success: false,
          error: `keystore "${name}" not found in registry`,
        };
      }

      if (!force) {
        return {
          success: false,
          error: `pass --force to confirm deletion of keystore "${name}" at ${entry.path}`,
        };
      }

      const updated = registry.filter((e) => e.name !== name);
      await writeRegistry(registryPath, updated);

      await fs.rm(entry.path, { recursive: true, force: true });

      return { success: true, data: entry };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
