import type { Command } from "commander";
import type { CommandContext, CommandResult, ISubCommand } from "@envctrl/types";

/**
 * Abstract base for all top-level CLI commands.
 *
 * Subclasses implement {@link register} to attach their Commander subcommand
 * to the program. The {@link dispatch} helper handles uniform result
 * printing and process exit on failure.
 */
export abstract class BaseCommand {
  /**
   * Attaches this command's Commander definition onto `program`.
   *
   * @param program - The root Commander program instance
   */
  abstract register(program: Command): void;

  /**
   * Executes a subcommand and handles the result.
   *
   * Prints the error message to stderr and exits with code 1 on failure.
   * Prints data as JSON to stdout on success when `context.quiet` is false.
   *
   * @param cmd - The subcommand to execute
   * @param options - Parsed options from Commander
   * @param context - Injected runtime context
   */
  protected async dispatch<TOptions, TResult>(
    cmd: ISubCommand<TOptions, TResult>,
    options: TOptions,
    context: CommandContext
  ): Promise<void> {
    const result: CommandResult<TResult> = await cmd.execute(options, context);

    if (!result.success) {
      process.stderr.write(`error: ${result.error ?? "unknown error"}\n`);
      process.exit(1);
    }

    if (!context.quiet && result.data !== undefined) {
      process.stdout.write(JSON.stringify(result.data, null, 2) + "\n");
    }
  }

  /**
   * Builds a {@link CommandContext} from the Commander program's global options.
   *
   * @param program - The root Commander program instance
   */
  protected buildContext(program: Command): CommandContext {
    const opts = program.opts<{ quiet?: boolean }>();
    return {
      cwd: process.cwd(),
      quiet: opts.quiet ?? false,
    };
  }
}
