import fs from "node:fs/promises";
import type { Command } from "commander";
import type {
  CommandContext,
  CommandResult,
  ISubCommand,
  SetResult,
} from "@envctrl/types";
import { BaseCommand } from "../../base-command.js";
import { buildEnvFilePair, upsertEnvLine } from "../../utils/env-files.js";
import { setKeyValue } from "../../utils/dotenvx.js";

/** Options parsed by Commander for the `set` subcommand. */
interface SetOptions {
  environment: string;
  key: string;
  value: string;
}

/**
 * Sets a single environment variable in both the unencrypted and encrypted files.
 *
 * Writes the key to the plaintext `.env.[env].unencrypted` file first to
 * maintain human-readable source of truth, then calls dotenvx `set` to
 * write and encrypt the value in `.env.[env]`.
 */
export class SetCommand implements ISubCommand<SetOptions, SetResult> {
  /** @inheritdoc */
  async execute(
    options: SetOptions,
    context: CommandContext
  ): Promise<CommandResult<SetResult>> {
    const { environment, key, value } = options;
    const pair = buildEnvFilePair(environment, context.cwd);

    try {
      let existingContent = "";
      try {
        existingContent = await fs.readFile(pair.unencrypted, "utf8");
      } catch {
      }

      const updatedContent = upsertEnvLine(existingContent, key, value);
      await fs.writeFile(pair.unencrypted, updatedContent, "utf8");

      const result = setKeyValue(key, value, pair.encrypted);
      const changed = result.changedFilepaths.length > 0;

      return {
        success: true,
        data: { environment, key, changed },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/** Registers the `set <environment> <key> <value>` command onto the Commander program. */
export class SetBaseCommand extends BaseCommand {
  /** @inheritdoc */
  register(program: Command): void {
    program
      .command("set <environment> <key> <value>")
      .description(
        "Set an environment variable and sync it to the encrypted file"
      )
      .action(async (environment: string, key: string, value: string) => {
        await this.dispatch(
          new SetCommand(),
          { environment, key, value },
          this.buildContext(program)
        );
      });
  }
}
