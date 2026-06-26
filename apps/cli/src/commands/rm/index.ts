import fs from 'node:fs/promises';
import path from 'node:path';
import type { Command } from 'commander';
import type { CommandContext, CommandResult, EnvironmentName, ISubCommand, RemoveResult } from '@envctrl/types';
import { BaseCommand } from '../../base-command.js';
import { listEnvFiles } from '../../utils/dotenvx.js';
import { parseEnvironmentFromFilename } from '../../utils/env-files.js';

/** Options parsed by Commander for the `rm` subcommand. */
interface RmOptions {
  environment: EnvironmentName;
  all: boolean;
  force: boolean;
}

/**
 * Removes environment files from the working directory.
 *
 * Without `--force`, performs a dry run listing files that would be deleted.
 * With `-a`, includes all associated file variants (`.local`, `.unencrypted`).
 * With `--force`, permanently deletes the resolved files.
 */
export class RmCommand implements ISubCommand<RmOptions, RemoveResult> {
  /** @inheritdoc */
  async execute(options: RmOptions, context: CommandContext): Promise<CommandResult<RemoveResult>> {
    const { environment, all, force } = options;

    try {
      const allFiles = listEnvFiles(context.cwd, '.env.*', ['.env.keys']);
      const candidates = allFiles.filter((f) => {
        const name = parseEnvironmentFromFilename(path.basename(f));
        return name === environment;
      });

      if (!all) {
        const primary = path.resolve(context.cwd, `.env.${environment}`);
        const subset = candidates.filter((f) => f === primary);
        return buildResult(environment, subset, force);
      }

      return buildResult(environment, candidates, force);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

async function buildResult(
  environment: EnvironmentName,
  files: string[],
  force: boolean,
): Promise<CommandResult<RemoveResult>> {
  if (!force) {
    const preview = files.length > 0
      ? `Would delete:\n${files.map((f) => `  ${f}`).join('\n')}\n\nPass --force to confirm deletion.`
      : `No files found for environment: ${environment}`;

    return {
      success: true,
      data: { environment, deletedFiles: [] },
      message: preview,
    };
  }

  const deleted: string[] = [];
  for (const f of files) {
    try {
      await fs.rm(f, { force: true });
      deleted.push(f);
    } catch {}
  }

  const message =
    deleted.length > 0
      ? `Deleted:\n${deleted.map((f) => `  ${f}`).join('\n')}`
      : `No files found for environment: ${environment}`;

  return {
    success: true,
    data: { environment, deletedFiles: deleted },
    message,
  };
}

/** Registers the `rm <environment>` command onto the Commander program. */
export class RmBaseCommand extends BaseCommand {
  /** @inheritdoc */
  register(program: Command): void {
    program
      .command('rm <environment>')
      .description('Remove environment files from the working directory')
      .option('-a, --all', 'include all associated file variants (.local, .unencrypted)', false)
      .option('--force', 'actually delete files (default is dry run)', false)
      .action(async (environment: string, opts: { all: boolean; force: boolean }) => {
        await this.dispatch(
          new RmCommand(),
          { environment, all: opts.all, force: opts.force },
          this.buildContext(program),
        );
      });
  }
}
