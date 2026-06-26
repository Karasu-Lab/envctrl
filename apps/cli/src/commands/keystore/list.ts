import type { CommandContext, CommandResult, ISubCommand, KeystoreEntry } from '@envctrl/types';
import { resolveKeystoresRegistryPath } from '../../utils/platform.js';
import { readRegistry } from './registry.js';

/**
 * Lists all registered keystores from the global registry.
 *
 * Returns an empty array if no keystores have been created yet.
 */
export class KeystoreListSubCommand implements ISubCommand<Record<string, never>, KeystoreEntry[]> {
  /** @inheritdoc */
  async execute(
    _options: Record<string, never>,
    _context: CommandContext,
  ): Promise<CommandResult<KeystoreEntry[]>> {
    try {
      const registryPath = resolveKeystoresRegistryPath();
      const entries = await readRegistry(registryPath);
      return { success: true, data: entries };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
