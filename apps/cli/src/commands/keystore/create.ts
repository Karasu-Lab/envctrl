import fs from "node:fs/promises";
import path from "node:path";
import type {
  CommandContext,
  CommandResult,
  ISubCommand,
  KeystoreConfig,
} from "@envctrl/types";
import {
  resolveDefaultKeystorePath,
  resolveKeystoresRegistryPath,
} from "../../utils/platform.js";
import { readRegistry, writeRegistry } from "./registry.js";

/** Options parsed by Commander for `keystore create`. */
export interface KeystoreCreateOptions {
  keystorePath: string | undefined;
  name: string | undefined;
}

/**
 * Creates a new keystore directory and registers it in the global registry.
 *
 * If no path is provided, defaults to the platform-appropriate application
 * data directory. An empty `.env.keys` stub is written on first creation.
 */
export class KeystoreCreateSubCommand
  implements ISubCommand<KeystoreCreateOptions, KeystoreConfig>
{
  /** @inheritdoc */
  async execute(
    options: KeystoreCreateOptions,
    _context: CommandContext
  ): Promise<CommandResult<KeystoreConfig>> {
    const keystorePath = options.keystorePath ?? resolveDefaultKeystorePath();
    const name = options.name ?? path.basename(keystorePath);

    try {
      await fs.mkdir(keystorePath, { recursive: true });

      const keysFile = path.join(keystorePath, ".env.keys");
      try {
        await fs.access(keysFile);
      } catch {
        await fs.writeFile(keysFile, "# dotenvx keys\n", "utf8");
      }

      const registryPath = resolveKeystoresRegistryPath();
      await fs.mkdir(path.dirname(registryPath), { recursive: true });

      const registry = await readRegistry(registryPath);
      const exists = registry.some((e) => e.name === name || e.path === keystorePath);

      if (!exists) {
        registry.push({ name, path: keystorePath });
        await writeRegistry(registryPath, registry);
      }

      return { success: true, data: { path: keystorePath } };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
