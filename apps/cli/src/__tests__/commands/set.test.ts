import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CommandContext } from '@envctrl/types';

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock('../../utils/dotenvx.js', () => ({
  setKeyValue: vi.fn(),
}));

const mockContext: CommandContext = { cwd: '/project', quiet: false };

describe('SetCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes key to unencrypted file and calls dotenvx set', async () => {
    const fs = await import('node:fs/promises');
    const { setKeyValue } = await import('../../utils/dotenvx.js');
    const { SetCommand } = await import('../../commands/set/index.js');

    vi.mocked(fs.default.readFile).mockResolvedValue('EXISTING=value\n' as never);
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);
    vi.mocked(setKeyValue).mockReturnValue({
      changedFilepaths: ['/project/.env.development'],
      unchangedFilepaths: [],
    });

    const cmd = new SetCommand();
    const result = await cmd.execute(
      { environment: 'development', key: 'NEW_KEY', value: 'new_value' },
      mockContext,
    );

    expect(result.success).toBe(true);
    expect(result.data?.key).toBe('NEW_KEY');
    expect(result.data?.changed).toBe(true);
    expect(fs.default.writeFile).toHaveBeenCalledWith(
      '/project/.env.development.unencrypted',
      expect.stringContaining('NEW_KEY=new_value'),
      'utf8',
    );
    expect(setKeyValue).toHaveBeenCalledWith('NEW_KEY', 'new_value', '/project/.env.development');
  });

  it('returns success false when dotenvx throws', async () => {
    const fs = await import('node:fs/promises');
    const { setKeyValue } = await import('../../utils/dotenvx.js');
    const { SetCommand } = await import('../../commands/set/index.js');

    vi.mocked(fs.default.readFile).mockResolvedValue('' as never);
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);
    vi.mocked(setKeyValue).mockImplementation(() => {
      throw new Error('encrypt failed');
    });

    const cmd = new SetCommand();
    const result = await cmd.execute(
      { environment: 'development', key: 'KEY', value: 'val' },
      mockContext,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('encrypt failed');
  });
});
