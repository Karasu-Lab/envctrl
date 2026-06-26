import type { Command } from 'commander';
import type { BlacklistResult, CommandContext, CommandResult, EnvironmentName, ISubCommand } from '@envctrl/types';
import { BaseCommand } from '../../base-command.js';
import { readBlacklist, writeBlacklist } from '../../utils/blacklist.js';

/** Options parsed by Commander for `blacklist add`. */
interface BlacklistAddOptions {
  environment: EnvironmentName;
}

/** Options parsed by Commander for `blacklist rm`. */
interface BlacklistRmOptions {
  environment: EnvironmentName;
}

/**
 * Adds an environment name to the global blacklist, preventing it from
 * appearing in auto-detection results such as `envctrl list`.
 */
export class BlacklistAddSubCommand implements ISubCommand<BlacklistAddOptions, BlacklistResult> {
  /** @inheritdoc */
  async execute(
    options: BlacklistAddOptions,
    _context: CommandContext,
  ): Promise<CommandResult<BlacklistResult>> {
    const { environment } = options;

    try {
      const current = await readBlacklist();

      if (current.includes(environment)) {
        return {
          success: true,
          data: { environment, blacklisted: current },
          message: `Environment "${environment}" is already blacklisted.`,
        };
      }

      const updated = [...current, environment];
      await writeBlacklist(updated);

      return {
        success: true,
        data: { environment, blacklisted: updated },
        message: `Added "${environment}" to the blacklist.\nBlacklisted environments:\n${updated.map((e) => `  ${e}`).join('\n')}`,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/**
 * Removes an environment name from the global blacklist, restoring it to
 * auto-detection results such as `envctrl list`.
 */
export class BlacklistRmSubCommand implements ISubCommand<BlacklistRmOptions, BlacklistResult> {
  /** @inheritdoc */
  async execute(
    options: BlacklistRmOptions,
    _context: CommandContext,
  ): Promise<CommandResult<BlacklistResult>> {
    const { environment } = options;

    try {
      const current = await readBlacklist();

      if (!current.includes(environment)) {
        return {
          success: false,
          error: `Environment "${environment}" is not in the blacklist.`,
        };
      }

      const updated = current.filter((e) => e !== environment);
      await writeBlacklist(updated);

      const message =
        updated.length > 0
          ? `Removed "${environment}" from the blacklist.\nBlacklisted environments:\n${updated.map((e) => `  ${e}`).join('\n')}`
          : `Removed "${environment}" from the blacklist.\nBlacklist is now empty.`;

      return {
        success: true,
        data: { environment, blacklisted: updated },
        message,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/** Registers the `blacklist` command group onto the Commander program. */
export class BlacklistBaseCommand extends BaseCommand {
  /** @inheritdoc */
  register(program: Command): void {
    const blacklist = program
      .command('blacklist')
      .description('Manage the environment auto-detection blacklist');

    blacklist
      .command('add <environment>')
      .description('Exclude an environment from auto-detection')
      .action(async (environment: string) => {
        await this.dispatch(
          new BlacklistAddSubCommand(),
          { environment },
          this.buildContext(program),
        );
      });

    blacklist
      .command('rm <environment>')
      .description('Re-include an environment in auto-detection')
      .action(async (environment: string) => {
        await this.dispatch(
          new BlacklistRmSubCommand(),
          { environment },
          this.buildContext(program),
        );
      });
  }
}
