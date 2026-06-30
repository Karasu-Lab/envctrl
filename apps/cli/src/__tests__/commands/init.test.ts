import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandContext } from '@envctrl/types';

vi.mock('node:fs/promises', () => ({
  default: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    symlink: vi.fn(),
    copyFile: vi.fn(),
  },
}));

vi.mock('node:readline/promises', () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn(),
    close: vi.fn(),
  })),
}));

vi.mock('../../utils/dotenvx.js', () => ({
  listEnvFiles: vi.fn(() => []),
}));

vi.mock('../../utils/platform.js', () => ({
  resolveDefaultKeystorePath: vi.fn(() => '/home/user/.envctrl/myproject'),
  resolveKeystoresRegistryPath: vi.fn(() => '/home/user/.envctrl/registry.json'),
}));

vi.mock('../../utils/config.js', () => ({
  writeConfig: vi.fn(() => Promise.resolve('/project/.envctrl/config.json')),
}));

vi.mock('../../utils/build-env.js', () => ({
  detectBuildEnvironment: vi.fn(() => ({ environment: null, provider: null })),
}));

vi.mock('../../commands/keystore/registry.js', () => ({
  readRegistry: vi.fn(() => Promise.resolve([])),
  writeRegistry: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../commands/init/workspace.js', () => ({
  findWorkspaceRoot: vi.fn(() => Promise.resolve('/project')),
  scanWorkspacePackages: vi.fn(() => Promise.resolve([])),
}));

const mockContext: CommandContext = { cwd: '/project', quiet: false };

describe('InitCommand gitignore prompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates .gitignore when user answers y', async () => {
    const fs = await import('node:fs/promises');
    const readline = await import('node:readline/promises');
    const { InitCommand } = await import('../../commands/init/index.js');

    const mockRl = { question: vi.fn(() => Promise.resolve('y')), close: vi.fn() };
    vi.mocked(readline.createInterface).mockReturnValue(mockRl as never);

    vi.mocked(fs.default.access).mockImplementation(async (p) => {
      if (String(p).endsWith('.git')) return;
      throw new Error('not found');
    });
    vi.mocked(fs.default.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.default.readFile).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);

    const cmd = new InitCommand();
    const result = await cmd.execute(
      { workspace: undefined, name: undefined, keystore: undefined, configDir: undefined, configFile: undefined },
      mockContext,
    );

    expect(result.success).toBe(true);
    expect(result.data?.gitignoreUpdated).toBe(true);
    expect(mockRl.question).toHaveBeenCalledWith('Configure .gitignore for envctrl? [y/N] ');
    const written = vi.mocked(fs.default.writeFile).mock.calls.find(([p]) =>
      String(p).endsWith('.gitignore'),
    );
    expect(written).toBeDefined();
    expect(String(written?.[1])).toContain('.env.*.unencrypted');
  });

  it('skips .gitignore update when user answers n', async () => {
    const fs = await import('node:fs/promises');
    const readline = await import('node:readline/promises');
    const { InitCommand } = await import('../../commands/init/index.js');

    const mockRl = { question: vi.fn(() => Promise.resolve('n')), close: vi.fn() };
    vi.mocked(readline.createInterface).mockReturnValue(mockRl as never);

    vi.mocked(fs.default.access).mockImplementation(async (p) => {
      if (String(p).endsWith('.git')) return;
      throw new Error('not found');
    });
    vi.mocked(fs.default.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.default.readFile).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);

    const cmd = new InitCommand();
    const result = await cmd.execute(
      { workspace: undefined, name: undefined, keystore: undefined, configDir: undefined, configFile: undefined },
      mockContext,
    );

    expect(result.success).toBe(true);
    expect(result.data?.gitignoreUpdated).toBe(false);
    const written = vi.mocked(fs.default.writeFile).mock.calls.find(([p]) =>
      String(p).endsWith('.gitignore'),
    );
    expect(written).toBeUndefined();
  });

  it('skips prompt when quiet mode is active', async () => {
    const fs = await import('node:fs/promises');
    const readline = await import('node:readline/promises');
    const { InitCommand } = await import('../../commands/init/index.js');

    const mockRl = { question: vi.fn(), close: vi.fn() };
    vi.mocked(readline.createInterface).mockReturnValue(mockRl as never);

    vi.mocked(fs.default.access).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.default.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.default.readFile).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);

    const cmd = new InitCommand();
    const result = await cmd.execute(
      { workspace: undefined, name: undefined, keystore: undefined, configDir: undefined, configFile: undefined },
      { cwd: '/project', quiet: true },
    );

    expect(result.success).toBe(true);
    expect(result.data?.gitignoreUpdated).toBe(false);
    expect(mockRl.question).not.toHaveBeenCalled();
  });

  it('skips prompt when not inside a git repo', async () => {
    const fs = await import('node:fs/promises');
    const readline = await import('node:readline/promises');
    const { InitCommand } = await import('../../commands/init/index.js');

    const mockRl = { question: vi.fn(), close: vi.fn() };
    vi.mocked(readline.createInterface).mockReturnValue(mockRl as never);

    vi.mocked(fs.default.access).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.default.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.default.readFile).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);

    const cmd = new InitCommand();
    const result = await cmd.execute(
      { workspace: undefined, name: undefined, keystore: undefined, configDir: undefined, configFile: undefined },
      mockContext,
    );

    expect(result.success).toBe(true);
    expect(result.data?.gitignoreUpdated).toBe(false);
    expect(mockRl.question).not.toHaveBeenCalled();
  });
});
