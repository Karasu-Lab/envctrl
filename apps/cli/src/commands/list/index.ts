import path from 'node:path';
import type { Command } from 'commander';
import type { CommandContext, CommandResult, EnvironmentName, ISubCommand, ListResult } from '@envctrl/types';
import { BaseCommand } from '../../base-command.js';
import { listEnvFiles } from '../../utils/dotenvx.js';
import { parseEnvironmentFromFilename } from '../../utils/env-files.js';

/**
 * Lists all unique environment names discovered in the working directory by
 * scanning `.env.*` files and normalising `.local` and `.unencrypted` suffixes.
 */
export class ListCommand implements ISubCommand<Record<string, never>, ListResult> {
  /** @inheritdoc */
  async execute(
    _options: Record<string, never>,
    context: CommandContext,
  ): Promise<CommandResult<ListResult>> {
    try {
      const files = listEnvFiles(context.cwd, '.env.*', ['.env.keys']);
      const names = files
        .map((f) => parseEnvironmentFromFilename(path.basename(f)))
        .filter((e): e is EnvironmentName => e !== undefined);
      const environments = [...new Set(names)].sort();

      return { success: true, data: { environments } };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/** Registers the `list` command onto the Commander program. */
export class ListBaseCommand extends BaseCommand {
  /** @inheritdoc */
  register(program: Command): void {
    program
      .command('list')
      .description('List all environment names discovered in the working directory')
      .action(async () => {
        await this.dispatch(new ListCommand(), {}, this.buildContext(program));
      });
  }
}
