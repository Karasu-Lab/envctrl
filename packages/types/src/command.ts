/**
 * Runtime context injected into every subcommand execution.
 * Contains the resolved working directory and global flags.
 */
export interface CommandContext {
  readonly cwd: string;
  readonly quiet: boolean;
}

/** Uniform result envelope returned from every subcommand execution. */
export interface CommandResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

/**
 * Contract every concrete command must satisfy.
 * Separates what to execute from how the CLI routes to it.
 *
 * @template TOptions - Parsed options object passed from Commander
 * @template TResult - Shape of the `data` field in the returned {@link CommandResult}
 */
export interface ISubCommand<TOptions = Record<string, unknown>, TResult = unknown> {
  execute(options: TOptions, context: CommandContext): Promise<CommandResult<TResult>>;
}
