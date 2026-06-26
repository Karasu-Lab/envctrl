import fs from 'node:fs/promises';
import path from 'node:path';
import type { Command } from 'commander';
import type { CommandContext, CommandResult, EncryptResult, ISubCommand } from '@envctrl/types';
import { BaseCommand } from '../../base-command.js';
import { parseEnvironmentFromFilename } from '../../utils/env-files.js';
import { listEnvFiles, encryptFile } from '../../utils/dotenvx.js';

/** Options parsed by Commander for the `encrypt` subcommand. */
interface EncryptOptions {
  files: string[];
}

/**
 * Encrypts existing plaintext `.env.*` files using dotenvx, backing up each file's
 * content to `.env.[env].unencrypted` before encrypting in-place.
 * Defaults to all `.env.*` files in the working directory when no files are specified.
 */
export class EncryptCommand implements ISubCommand<EncryptOptions, EncryptResult> {
  /** @inheritdoc */
  async execute(
    options: EncryptOptions,
    context: CommandContext,
  ): Promise<CommandResult<EncryptResult>> {
    const { cwd } = context;

    try {
      const targets =
        options.files.length > 0
          ? options.files.map((f) => path.resolve(cwd, f))
          : listEnvFiles(cwd, '.env.*', ['.env.keys', '*.unencrypted']);

      const changedFiles: string[] = [];
      const unchangedFiles: string[] = [];

      for (const filePath of targets) {
        const basename = path.basename(filePath);
        const environment = parseEnvironmentFromFilename(basename);

        if (!environment) {
          unchangedFiles.push(filePath);
          continue;
        }

        const unencryptedPath = path.resolve(
          path.dirname(filePath),
          `.env.${environment}.unencrypted`,
        );

        try {
          const content = await fs.readFile(filePath, 'utf8');

          try {
            await fs.access(unencryptedPath);
          } catch {
            await fs.writeFile(unencryptedPath, content, 'utf8');
          }

          const result = await encryptFile(filePath);
          changedFiles.push(...result.changedFilepaths);
        } catch {
          unchangedFiles.push(filePath);
        }
      }

      return {
        success: true,
        data: { changedFiles, unchangedFiles },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/** Registers the `encrypt [files...]` command onto the Commander program. */
export class EncryptBaseCommand extends BaseCommand {
  /** @inheritdoc */
  register(program: Command): void {
    program
      .command('encrypt [files...]')
      .description('Encrypt plaintext .env.* files and create .unencrypted backups')
      .action(async (files: string[]) => {
        await this.dispatch(new EncryptCommand(), { files }, this.buildContext(program));
      });
  }
}
