import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandContext } from '@envctrl/types';

vi.mock('node:fs/promises', () => ({
  default: {
    access: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    symlink: vi.fn(),
    copyFile: vi.fn(),
  },
}));

vi.mock('../../utils/dotenvx.js', () => ({
  listEnvFiles: vi.fn(),
  setKeyValue: vi.fn(),
}));

vi.mock('../../utils/config.js', () => ({
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

vi.mock('../../commands/switch/sync.js', () => ({
  syncUnencryptedToEncrypted: vi.fn(),
}));

const mockContext: CommandContext = { cwd: '/project', quiet: false };

describe('CreateCommand --from', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves comments and blank lines from base environment', async () => {
    const fs = await import('node:fs/promises');
    const { listEnvFiles } = await import('../../utils/dotenvx.js');
    const { readConfig, writeConfig } = await import('../../utils/config.js');
    const { syncUnencryptedToEncrypted } = await import('../../commands/switch/sync.js');
    const { CreateCommand } = await import('../../commands/create/index.js');

    const baseContent = [
      '# Database settings',
      'DB_HOST=localhost',
      'DB_PORT=5432',
      '',
      '# Auth settings',
      'SECRET_KEY=mysecret',
    ].join('\n');

    vi.mocked(listEnvFiles).mockReturnValue([
      '/project/.env.staging.unencrypted',
      '/project/.env.staging',
    ]);
    vi.mocked(fs.default.readFile).mockImplementation(async (p) => {
      if (String(p).endsWith('staging.unencrypted')) return baseContent as never;
      if (String(p).endsWith('config.json')) throw new Error('not found');
      return '' as never;
    });
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.default.access).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.default.symlink).mockResolvedValue(undefined);
    vi.mocked(readConfig).mockResolvedValue(null);
    vi.mocked(writeConfig).mockResolvedValue(undefined);
    vi.mocked(syncUnencryptedToEncrypted).mockResolvedValue(undefined);

    const cmd = new CreateCommand();
    const result = await cmd.execute(
      { environment: 'production', from: 'staging' },
      mockContext,
    );

    expect(result.success).toBe(true);

    const writtenContent = vi
      .mocked(fs.default.writeFile)
      .mock.calls.find(([p]) => String(p).endsWith('production.unencrypted'))?.[1] as string;

    expect(writtenContent).toContain('# Database settings');
    expect(writtenContent).toContain('# Auth settings');
    expect(writtenContent).toContain('DB_HOST=');
    expect(writtenContent).toContain('SECRET_KEY=');
    expect(writtenContent).not.toContain('localhost');
    expect(writtenContent).not.toContain('mysecret');
  });

  it('strips values while preserving key names', async () => {
    const fs = await import('node:fs/promises');
    const { listEnvFiles } = await import('../../utils/dotenvx.js');
    const { readConfig, writeConfig } = await import('../../utils/config.js');
    const { syncUnencryptedToEncrypted } = await import('../../commands/switch/sync.js');
    const { CreateCommand } = await import('../../commands/create/index.js');

    const baseContent = 'API_KEY=secret123\nDEBUG=true\n';

    vi.mocked(listEnvFiles).mockReturnValue([
      '/project/.env.dev.unencrypted',
      '/project/.env.dev',
    ]);
    vi.mocked(fs.default.readFile).mockResolvedValue(baseContent as never);
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.default.access).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.default.symlink).mockResolvedValue(undefined);
    vi.mocked(readConfig).mockResolvedValue(null);
    vi.mocked(writeConfig).mockResolvedValue(undefined);
    vi.mocked(syncUnencryptedToEncrypted).mockResolvedValue(undefined);

    const cmd = new CreateCommand();
    await cmd.execute({ environment: 'staging', from: 'dev' }, mockContext);

    const writtenContent = vi
      .mocked(fs.default.writeFile)
      .mock.calls.find(([p]) => String(p).endsWith('staging.unencrypted'))?.[1] as string;

    expect(writtenContent).toContain('API_KEY=');
    expect(writtenContent).toContain('DEBUG=');
    expect(writtenContent).not.toContain('secret123');
    expect(writtenContent).not.toContain('true');
  });
});
