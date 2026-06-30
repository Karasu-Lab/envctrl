import { spawn } from 'node:child_process';
import type { Command } from 'commander';
import type { CommandContext, CommandResult, ISubCommand, RunResult } from '@envctrl/types';
import { BaseCommand } from '../../base-command.js';
import { buildEnvFilePair } from '../../utils/env-files.js';
import { resolveDotenvxBin } from '../../utils/dotenvx.js';
import { readConfig } from '../../utils/config.js';

/** Options parsed by Commander for the `run` subcommand. */
interface RunOptions {
  environment: string | undefined;
  commandArgs: string[];
}

/**
 * Decrypts the named environment file and runs an arbitrary command with the
 * decrypted variables injected into the child process environment.
 *
 * Delegates decryption and execution to the bundled `dotenvx run` CLI, which
 * resolves the private key from the local `.env.keys` symlink or keystore.
 */
export class RunCommand implements ISubCommand<RunOptions, RunResult> {
  /** @inheritdoc */
  async execute(options: RunOptions, context: CommandContext): Promise<CommandResult<RunResult>> {
    const { cwd } = context;

    let environment = options.environment;
    if (!environment) {
      const config = await readConfig(cwd);
      if (!config) {
        return {
          success: false,
          error:
            'No environment specified and no active environment found in .envctrl/config.json. ' +
            'Run `envctrl switch <environment>` first or pass the environment name explicitly.',
        };
      }
      environment = config.environment;
    }

    if (options.commandArgs.length === 0) {
      return {
        success: false,
        error: 'No command specified after --. Usage: envctrl run [environment] -- <command>',
      };
    }

    const pair = buildEnvFilePair(environment, cwd);
    const bin = resolveDotenvxBin();

    return new Promise<CommandResult<RunResult>>((resolve) => {
      const child = spawn(
        process.execPath,
        [bin, 'run', '-f', pair.encrypted, '--', ...options.commandArgs],
        { stdio: 'inherit', cwd },
      );

      child.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      child.on('close', (code) => {
        const exitCode = code ?? 1;
        if (exitCode !== 0) {
          process.exit(exitCode);
        }
        resolve({ success: true, data: { environment: environment!, exitCode } });
      });
    });
  }
}

/** Registers the `run [environment] -- <command>` command onto the Commander program. */
export class RunBaseCommand extends BaseCommand {
  /** @inheritdoc */
  register(program: Command): void {
    program
      .command('run [environment]')
      .description(
        'Run a command with decrypted environment variables injected\n' +
          'Usage: envctrl run [environment] -- <command> [args...]',
      )
      .allowUnknownOption()
      .action(async (environment: string | undefined) => {
        const doubleDashIdx = process.argv.indexOf('--');
        const commandArgs = doubleDashIdx !== -1 ? process.argv.slice(doubleDashIdx + 1) : [];

        await this.dispatch(
          new RunCommand(),
          { environment, commandArgs },
          this.buildContext(program),
        );
      });
  }
}
