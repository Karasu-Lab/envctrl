import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import type { Command } from 'commander';
import type {
  CommandContext,
  CommandResult,
  CreateResult,
  EnvironmentName,
  ISubCommand,
} from '@envctrl/types';
import { BaseCommand } from '../../base-command.js';
import { listEnvFiles, setKeyValue } from '../../utils/dotenvx.js';
import { parseEnvContent, parseEnvironmentFromFilename, buildEnvFilePair } from '../../utils/env-files.js';
import { readConfig, writeConfig } from '../../utils/config.js';
import { syncUnencryptedToEncrypted } from '../switch/sync.js';

/** Options parsed by Commander for the `create` subcommand. */
interface CreateOptions {
  environment: EnvironmentName;
  /**
   * Base environment whose key names are copied into the new environment (values set to empty).
   * Required when `environment` is `"example"` and omitted interactively; optional otherwise.
   */
  from: string | undefined;
}

/**
 * Returns the list of currently existing environment names by scanning `.env.*` files
 * in `cwd`, excluding `.env.keys` and `.env.example`.
 */
async function listExistingEnvironments(cwd: string): Promise<EnvironmentName[]> {
  const files = listEnvFiles(cwd, '.env.*', ['.env.keys']);
  const names = files
    .map((f) => parseEnvironmentFromFilename(path.basename(f)))
    .filter((e): e is EnvironmentName => e !== undefined);
  return [...new Set(names)];
}

/**
 * Reads an unencrypted env file and returns a derived string that preserves
 * comments and blank lines while clearing all values (key names only).
 */
async function buildExampleContent(unencryptedPath: string): Promise<string> {
  let raw = '';
  try {
    raw = await fs.readFile(unencryptedPath, 'utf8');
  } catch {
    return '';
  }

  const result = raw.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return line;
    }
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      return line;
    }
    return `${trimmed.slice(0, eqIdx).trim()}=`;
  });

  return result.join('\n');
}

/**
 * Creates environments or generates a `.env.example` file.
 *
 * - `example`: Writes `.env.example` with key names (empty values) copied from a base
 *   environment. If `--from` is omitted the user is prompted interactively.
 * - existing environment: Rejected with an error.
 * - new environment: Creates `.env.<env>.unencrypted` (empty, or pre-populated with key names
 *   from `--from` base environment) and the encrypted `.env.<env>`, records the environment
 *   in `.envctrl/config.json`, and re-encrypts `.env.local` from `.env.local.unencrypted`
 *   if present.
 */
export class CreateCommand implements ISubCommand<CreateOptions, CreateResult> {
  /** @inheritdoc */
  async execute(
    options: CreateOptions,
    context: CommandContext,
  ): Promise<CommandResult<CreateResult>> {
    const { environment, cwd } = { ...options, cwd: context.cwd };

    try {
      if (environment === 'example') {
        return await this.createExample(options.from, cwd);
      }

      const existing = await listExistingEnvironments(cwd);
      if (existing.includes(environment)) {
        return {
          success: false,
          error: `Environment "${environment}" already exists. Use "envctrl switch ${environment}" to activate it.`,
        };
      }

      return await this.createEnvironment(environment, cwd, options.from);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  private async createExample(
    from: string | undefined,
    cwd: string,
  ): Promise<CommandResult<CreateResult>> {
    const existing = await listExistingEnvironments(cwd);

    let base = from;
    if (!base) {
      if (existing.length === 0) {
        return {
          success: false,
          error: 'No environments found. Create one first with "envctrl create <environment>".',
        };
      }

      const rl = createInterface({ input: process.stdin, output: process.stdout });
      try {
        base = await rl.question(
          `Choose a base environment [${existing.join(', ')}]: `,
        );
      } finally {
        rl.close();
      }
    }

    if (!existing.includes(base)) {
      return {
        success: false,
        error: `Environment "${base}" does not exist. Available: ${existing.join(', ')}`,
      };
    }

    const pair = buildEnvFilePair(base, cwd);
    const content = await buildExampleContent(pair.unencrypted);
    const examplePath = path.resolve(cwd, '.env.example');
    await fs.writeFile(examplePath, content, 'utf8');

    return {
      success: true,
      data: {
        environment: 'example',
        createdFiles: [examplePath],
        isExample: true,
        baseEnvironment: base,
      },
      message: `Created .env.example from "${base}" (${Object.keys(parseEnvContent(content)).length} keys)`,
    };
  }

  private async createEnvironment(
    environment: EnvironmentName,
    cwd: string,
    from: string | undefined,
  ): Promise<CommandResult<CreateResult>> {
    const pair = buildEnvFilePair(environment, cwd);
    const created: string[] = [];

    if (from) {
      const existing = await listExistingEnvironments(cwd);
      if (!existing.includes(from)) {
        return {
          success: false,
          error: `Base environment "${from}" does not exist. Available: ${existing.join(', ')}`,
        };
      }
      const basePair = buildEnvFilePair(from, cwd);
      const content = await buildExampleContent(basePair.unencrypted);
      await fs.writeFile(pair.unencrypted, content, 'utf8');
    } else {
      await fs.writeFile(pair.unencrypted, '', 'utf8');
    }
    created.push(pair.unencrypted);

    if (from) {
      await syncUnencryptedToEncrypted(environment, cwd);
    } else {
      setKeyValue('_ENVCTRL_INIT', '1', pair.encrypted);
    }
    created.push(pair.encrypted);

    const config = (await readConfig(cwd)) ?? { environment };
    await writeConfig(cwd, { ...config, environment });

    const localUnencrypted = path.resolve(cwd, '.env.local.unencrypted');
    const localEncrypted = path.resolve(cwd, '.env.local');
    const localExists = await fs
      .access(localUnencrypted)
      .then(() => true)
      .catch(() => false);

    if (localExists) {
      await syncUnencryptedToEncrypted('local', cwd);
    } else {
      const encryptedLocalExists = await fs
        .access(localEncrypted)
        .then(() => true)
        .catch(() => false);

      if (!encryptedLocalExists) {
        if (os.platform() === 'win32') {
          await fs.copyFile(pair.encrypted, localEncrypted);
        } else {
          await fs.symlink(pair.encrypted, localEncrypted);
        }
        created.push(localEncrypted);
      }
    }

    const lines = [
      `Created environment: ${environment}${from ? ` (from "${from}")` : ''}`,
      'Files:',
      ...created.map((f) => `  ${f}`),
    ];
    if (localExists) {
      lines.push(`Updated: ${localEncrypted}`);
    }

    return {
      success: true,
      data: { environment, createdFiles: created, isExample: false, baseEnvironment: from },
      message: lines.join('\n'),
    };
  }
}

/** Registers the `create <environment>` command onto the Commander program. */
export class CreateBaseCommand extends BaseCommand {
  /** @inheritdoc */
  register(program: Command): void {
    program
      .command('create <environment>')
      .description(
        'Create a new environment or generate .env.example (use "example" as the environment name)',
      )
      .option('--from <env>', 'copy key names (empty values) from this base environment')
      .action(async (environment: string, opts: { from?: string }) => {
        await this.dispatch(
          new CreateCommand(),
          { environment, from: opts.from },
          this.buildContext(program),
        );
      });
  }
}
