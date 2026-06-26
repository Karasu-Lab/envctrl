import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CommandContext } from "@envctrl/types";

vi.mock("node:fs/promises", () => ({
  default: {
    access: vi.fn(),
    writeFile: vi.fn(),
    rename: vi.fn(),
    unlink: vi.fn(),
    symlink: vi.fn(),
    copyFile: vi.fn(),
    readFile: vi.fn(),
  },
}));

vi.mock("../../utils/dotenvx.js", () => ({
  encryptFile: vi.fn(),
  setKeyValue: vi.fn(),
}));

vi.mock("../../commands/switch/sync.js", () => ({
  syncUnencryptedToEncrypted: vi.fn(),
}));

const mockContext: CommandContext = { cwd: "/project", quiet: false };

describe("SwitchCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates both files when neither exists and symlinks .env", async () => {
    const fs = await import("node:fs/promises");
    const { encryptFile } = await import("../../utils/dotenvx.js");
    const { syncUnencryptedToEncrypted } = await import(
      "../../commands/switch/sync.js"
    );
    const { SwitchCommand } = await import("../../commands/switch/index.js");

    vi.mocked(fs.default.access).mockRejectedValue(new Error("not found"));
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);
    vi.mocked(encryptFile).mockResolvedValue({
      changedFilepaths: ["/project/.env.development"],
      unchangedFilepaths: [],
    });
    vi.mocked(fs.default.rename).mockResolvedValue(undefined);
    vi.mocked(fs.default.unlink).mockResolvedValue(undefined);
    vi.mocked(fs.default.symlink).mockResolvedValue(undefined);
    vi.mocked(syncUnencryptedToEncrypted).mockResolvedValue(undefined);

    const cmd = new SwitchCommand();
    const result = await cmd.execute({ environment: "development" }, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.environment).toBe("development");
    expect(result.data?.activePath).toBe("/project/.env");
    expect(fs.default.symlink).toHaveBeenCalledWith(
      "/project/.env.development",
      "/project/.env"
    );
  });

  it("skips creation when both files already exist", async () => {
    const fs = await import("node:fs/promises");
    const { encryptFile } = await import("../../utils/dotenvx.js");
    const { syncUnencryptedToEncrypted } = await import(
      "../../commands/switch/sync.js"
    );
    const { SwitchCommand } = await import("../../commands/switch/index.js");

    vi.mocked(fs.default.access).mockResolvedValue(undefined);
    vi.mocked(fs.default.unlink).mockResolvedValue(undefined);
    vi.mocked(fs.default.symlink).mockResolvedValue(undefined);
    vi.mocked(syncUnencryptedToEncrypted).mockResolvedValue(undefined);

    const cmd = new SwitchCommand();
    const result = await cmd.execute({ environment: "development" }, mockContext);

    expect(result.success).toBe(true);
    expect(result.data?.created).toHaveLength(0);
    expect(encryptFile).not.toHaveBeenCalled();
  });
});
