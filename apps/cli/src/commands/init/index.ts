import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Command } from 'commander';
import type { CommandContext, CommandResult, InitResult, ISubCommand } from '@envctrl/types';
import { BaseCommand } from '../../base-command.js';
import { resolveDefaultKeystorePath, resolveKeystoresRegistryPath } from '../../utils/platform.js';
import { listEnvFiles } from '../../utils/dotenvx.js';
import { readRegistry, writeRegistry } from '../keystore/registry.js';
import { findWorkspaceRoot, scanWorkspacePackages } from './workspace.js';
import { detectBuildEnvironment } from '../../utils/build-env.js';
import { writeConfig } from '../../utils/config.js';

/** Options parsed by Commander for the `init` subcommand. */
interface InitOptions {
  workspace: string | undefined;
  name: string | undefined;
  keystore: string | undefined;
  /** Override the config directory name (default: `.envctrl`). */
  configDir: string | undefined;
  /** Override the config file name (default: `config.json`). */
  configFile: string | undefined;
}

/**
 * Initialises envctrl for an existing workspace or monorepo by creating a shared keystore,
 * symlinking `.env.keys` into every package directory, and writing a `.envctrl/config.json`
 * that records the active environment.
 *
 * When a recognised CI/CD provider (Vercel, Netlify, Railway) is detected via environment
 * variables, the environment is automatically resolved from the provider context instead of
 * defaulting to `"development"`.
 */
export class InitCommand implements ISubCommand<InitOptions, InitResult> {
  /** @inheritdoc */
  async execute(options: InitOptions, context: CommandContext): Promise<CommandResult<InitResult>> {
    const startDir = options.workspace
      ? path.resolve(context.cwd, options.workspace)
      : context.cwd;

    const configDir = options.configDir ?? '.envctrl';
    const configFile = options.configFile ?? 'config.json';

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
        const envFiles = listEnvFiles(dir, '.env.*', ['.env.keys']);
        if (envFiles.length === 0) continue;

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

      const buildEnv = detectBuildEnvironment();
      const environment = buildEnv.environment ?? 'development';
      const autoDetected = buildEnv.provider !== null;

      const configPath = await writeConfig(
        context.cwd,
        { environment },
        configDir,
        configFile,
      );

      const lines = [`Workspace: ${workspaceRoot}`, `Keystore:  ${keystorePath}`];
      if (packages.length > 0) {
        lines.push('Packages:');
        for (const p of packages) lines.push(`  ${p.name} (${p.path})`);
      }
      if (keysLinked.length > 0) {
        lines.push('Linked .env.keys:');
        for (const l of keysLinked) lines.push(`  ${l}`);
      }
      lines.push(
        `Config:    ${configPath}`,
        `Environment: ${environment}${autoDetected ? ` (auto-detected from ${buildEnv.provider})` : ''}`,
      );

      return {
        success: true,
        data: { workspaceRoot, packages, keystorePath, keysLinked, configPath, environment, autoDetected },
        message: lines.join('\n'),
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
      .option('--config-dir <dir>', 'config directory name (default: .envctrl)')
      .option('--config-file <file>', 'config file name (default: config.json)')
      .action(
        async (
          workspace: string | undefined,
          opts: { name?: string; keystore?: string; configDir?: string; configFile?: string },
        ) => {
          await this.dispatch(
            new InitCommand(),
            {
              workspace,
              name: opts.name,
              keystore: opts.keystore,
              configDir: opts.configDir,
              configFile: opts.configFile,
            },
            this.buildContext(program),
          );
        },
      );
  }
}
