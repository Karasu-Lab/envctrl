import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Command } from 'commander';
import type { CommandContext, CommandResult, InitResult, ISubCommand } from '@envctrl/types';
import { BaseCommand } from '../../base-command.js';
import { resolveDefaultKeystorePath, resolveKeystoresRegistryPath } from '../../utils/platform.js';
import { readRegistry, writeRegistry } from '../keystore/registry.js';
import { findWorkspaceRoot, scanWorkspacePackages } from './workspace.js';

/** Options parsed by Commander for the `init` subcommand. */
interface InitOptions {
  workspace: string | undefined;
  name: string | undefined;
  keystore: string | undefined;
}

/**
 * Initialises envctrl for an existing workspace or monorepo.
 *
 * 1. Locates the workspace root by traversing up from the working directory.
 * 2. Scans all workspace packages.
 * 3. Creates a keystore and registers it.
 * 4. Symlinks the keystore `.env.keys` into each package directory so that
 *    dotenvx resolves the same key material across all packages when
 *    environments are switched.
 */
export class InitCommand implements ISubCommand<InitOptions, InitResult> {
  /** @inheritdoc */
  async execute(options: InitOptions, context: CommandContext): Promise<CommandResult<InitResult>> {
    const startDir = options.workspace
      ? path.resolve(context.cwd, options.workspace)
      : context.cwd;

    try {
      const workspaceRoot = await findWorkspaceRoot(startDir);
      const packages = await scanWorkspacePackages(workspaceRoot);

      const keystorePath = options.keystore ?? resolveDefaultKeystorePath();
      const keystoreName = options.name ?? path.basename(workspaceRoot);

      await fs.mkdir(keystorePath, { recursive: true });

      const keysFile = path.join(keystorePath, '.env.keys');
      try {
        await fs.access(keysFile);
      } catch {
        await fs.writeFile(keysFile, '# dotenvx keys\n', 'utf8');
      }

      const registryPath = resolveKeystoresRegistryPath();
      await fs.mkdir(path.dirname(registryPath), { recursive: true });
      const registry = await readRegistry(registryPath);
      const alreadyRegistered = registry.some(
        (e) => e.name === keystoreName || e.path === keystorePath,
      );
      if (!alreadyRegistered) {
        registry.push({ name: keystoreName, path: keystorePath });
        await writeRegistry(registryPath, registry);
      }

      const linkTargets = [
        workspaceRoot,
        ...packages.map((p) => path.resolve(workspaceRoot, p.path)),
      ];

      const keysLinked: string[] = [];

      for (const dir of linkTargets) {
        const linkPath = path.join(dir, '.env.keys');
        try {
          await fs.access(linkPath);
        } catch {
          if (os.platform() === 'win32') {
            await fs.copyFile(keysFile, linkPath);
          } else {
            await fs.symlink(keysFile, linkPath);
          }
          keysLinked.push(linkPath);
        }
      }

      return {
        success: true,
        data: { workspaceRoot, packages, keystorePath, keysLinked },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/** Registers the `init [workspace]` command onto the Commander program. */
export class InitBaseCommand extends BaseCommand {
  /** @inheritdoc */
  register(program: Command): void {
    program
      .command('init [workspace]')
      .description(
        'Scan the workspace or monorepo and link packages to a shared keystore',
      )
      .option('-n, --name <name>', 'name for the keystore entry in the registry')
      .option('-k, --keystore <path>', 'custom keystore directory path')
      .action(
        async (workspace: string | undefined, opts: { name?: string; keystore?: string }) => {
          await this.dispatch(
            new InitCommand(),
            { workspace, name: opts.name, keystore: opts.keystore },
            this.buildContext(program),
          );
        },
      );
  }
}
