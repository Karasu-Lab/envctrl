import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Command } from "commander";
import type {
  CommandContext,
  CommandResult,
  ISubCommand,
  SwitchResult,
} from "@envctrl/types";
import { BaseCommand } from "../../base-command.js";
import { buildEnvFilePair } from "../../utils/env-files.js";
import { setKeyValue } from "../../utils/dotenvx.js";
import { syncUnencryptedToEncrypted } from "./sync.js";

/** Options parsed by Commander for the `switch` subcommand. */
interface SwitchOptions {
  environment: string;
}

/**
 * Switches the active environment.
 *
 * Creates `.env.[env].unencrypted` and `.env.[env]` if they do not exist,
 * syncs keys from the unencrypted source into the encrypted file, and
 * points `.env` at the encrypted file via symlink (POSIX) or copy (Windows).
 */
export class SwitchCommand implements ISubCommand<SwitchOptions, SwitchResult> {
  /** @inheritdoc */
  async execute(
    options: SwitchOptions,
    context: CommandContext
  ): Promise<CommandResult<SwitchResult>> {
    const { environment, cwd } = { ...options, cwd: context.cwd };
    const pair = buildEnvFilePair(environment, cwd);
    const created: string[] = [];

    try {
      try {
        await fs.access(pair.unencrypted);
      } catch {
        await fs.writeFile(pair.unencrypted, "", "utf8");
        created.push(pair.unencrypted);
      }

      const encryptedExists = await fs
        .access(pair.encrypted)
        .then(() => true)
        .catch(() => false);

      await syncUnencryptedToEncrypted(environment, cwd);

      if (!encryptedExists) {
        const stillMissing = await fs
          .access(pair.encrypted)
          .then(() => false)
          .catch(() => true);

        if (stillMissing) {
          setKeyValue("_ENVCTRL_INIT", "1", pair.encrypted);
          created.push(pair.encrypted);
        } else {
          created.push(pair.encrypted);
        }
      }

      const activePath = path.resolve(cwd, ".env");

      try {
        await fs.unlink(activePath);
      } catch {
      }

      if (os.platform() === "win32") {
        await fs.copyFile(pair.encrypted, activePath);
      } else {
        await fs.symlink(pair.encrypted, activePath);
      }

      return {
        success: true,
        data: { environment, created, activePath },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/** Registers the `switch [environment]` command onto the Commander program. */
export class SwitchBaseCommand extends BaseCommand {
  /** @inheritdoc */
  register(program: Command): void {
    program
      .command("switch <environment>")
      .description(
        "Create, sync, and activate a named environment (.env.[env])"
      )
      .action(async (environment: string) => {
        await this.dispatch(
          new SwitchCommand(),
          { environment },
          this.buildContext(program)
        );
      });
  }
}
