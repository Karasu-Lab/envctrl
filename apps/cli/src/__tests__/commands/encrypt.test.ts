import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandContext } from '@envctrl/types';

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
  },
}));

vi.mock('../../utils/dotenvx.js', () => ({
  listEnvFiles: vi.fn(),
  encryptFile: vi.fn(),
}));

const mockContext: CommandContext = { cwd: '/project', quiet: false };

describe('EncryptCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('encrypts specified files and creates .unencrypted backups', async () => {
    const fs = await import('node:fs/promises');
    const { encryptFile } = await import('../../utils/dotenvx.js');
    const { EncryptCommand } = await import('../../commands/encrypt/index.js');

    vi.mocked(fs.default.readFile).mockResolvedValue('FOO=bar\n' as never);
    vi.mocked(fs.default.access).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);
    vi.mocked(encryptFile).mockResolvedValue({
      changedFilepaths: ['/project/.env.development'],
      unchangedFilepaths: [],
    });

    const cmd = new EncryptCommand();
    const result = await cmd.execute({ files: ['.env.development'] }, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.changedFiles).toContain('/project/.env.development');
    expect(fs.default.writeFile).toHaveBeenCalledWith(
      '/project/.env.development.unencrypted',
      'FOO=bar\n',
      'utf8',
    );
  });

  it('uses listEnvFiles when no files specified', async () => {
    const fs = await import('node:fs/promises');
    const { listEnvFiles, encryptFile } = await import('../../utils/dotenvx.js');
    const { EncryptCommand } = await import('../../commands/encrypt/index.js');

    vi.mocked(listEnvFiles).mockReturnValue(['/project/.env.production']);
    vi.mocked(fs.default.readFile).mockResolvedValue('KEY=val\n' as never);
    vi.mocked(fs.default.access).mockRejectedValue(new Error('not found'));
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);
    vi.mocked(encryptFile).mockResolvedValue({
      changedFilepaths: ['/project/.env.production'],
      unchangedFilepaths: [],
    });

    const cmd = new EncryptCommand();
    const result = await cmd.execute({ files: [] }, mockContext);

    expect(result.success).toBe(true);
    expect(listEnvFiles).toHaveBeenCalledWith('/project', '.env.*', ['.env.keys', '*.unencrypted']);
  });

  it('skips files with no detectable environment name', async () => {
    const { listEnvFiles, encryptFile } = await import('../../utils/dotenvx.js');
    const { EncryptCommand } = await import('../../commands/encrypt/index.js');

    vi.mocked(listEnvFiles).mockReturnValue(['/project/.env']);

    const cmd = new EncryptCommand();
    const result = await cmd.execute({ files: [] }, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.unchangedFiles).toContain('/project/.env');
    expect(encryptFile).not.toHaveBeenCalled();
  });
});
