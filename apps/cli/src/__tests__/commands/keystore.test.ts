import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CommandContext } from "@envctrl/types";

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn(),
    access: vi.fn(),
    writeFile: vi.fn(),
    rm: vi.fn(),
    readFile: vi.fn(),
  },
}));

vi.mock("../../utils/platform.js", () => ({
  resolveDefaultKeystorePath: vi.fn().mockReturnValue("/home/user/.local/share/envctrl"),
  resolveKeystoresRegistryPath: vi
    .fn()
    .mockReturnValue("/home/user/.local/share/envctrl/keystores.json"),
}));

vi.mock("../../commands/keystore/registry.js", () => ({
  readRegistry: vi.fn(),
  writeRegistry: vi.fn(),
}));

const mockContext: CommandContext = { cwd: "/project", quiet: false };

describe("KeystoreCreateSubCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates keystore directory and registers entry", async () => {
    const fs = await import("node:fs/promises");
    const { readRegistry, writeRegistry } = await import(
      "../../commands/keystore/registry.js"
    );
    const { KeystoreCreateSubCommand } = await import(
      "../../commands/keystore/create.js"
    );

    vi.mocked(fs.default.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.default.access).mockRejectedValue(new Error("not found"));
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);
    vi.mocked(readRegistry).mockResolvedValue([]);
    vi.mocked(writeRegistry).mockResolvedValue(undefined);

    const cmd = new KeystoreCreateSubCommand();
    const result = await cmd.execute(
      { keystorePath: "/custom/ks", name: "myks" },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.data?.path).toBe("/custom/ks");
    expect(fs.default.mkdir).toHaveBeenCalledWith("/custom/ks", { recursive: true });
    expect(writeRegistry).toHaveBeenCalledWith(
      expect.any(String),
      [{ name: "myks", path: "/custom/ks" }]
    );
  });

  it("uses default path when none provided", async () => {
    const fs = await import("node:fs/promises");
    const { readRegistry, writeRegistry } = await import(
      "../../commands/keystore/registry.js"
    );
    const { KeystoreCreateSubCommand } = await import(
      "../../commands/keystore/create.js"
    );

    vi.mocked(fs.default.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.default.access).mockRejectedValue(new Error("not found"));
    vi.mocked(fs.default.writeFile).mockResolvedValue(undefined);
    vi.mocked(readRegistry).mockResolvedValue([]);
    vi.mocked(writeRegistry).mockResolvedValue(undefined);

    const cmd = new KeystoreCreateSubCommand();
    const result = await cmd.execute(
      { keystorePath: undefined, name: undefined },
      mockContext
    );

    expect(result.success).toBe(true);
    expect(result.data?.path).toBe("/home/user/.local/share/envctrl");
  });
});

describe("KeystoreListSubCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all registry entries", async () => {
    const { readRegistry } = await import("../../commands/keystore/registry.js");
    const { KeystoreListSubCommand } = await import(
      "../../commands/keystore/list.js"
    );

    vi.mocked(readRegistry).mockResolvedValue([
      { name: "default", path: "/home/user/.local/share/envctrl" },
    ]);

    const cmd = new KeystoreListSubCommand();
    const result = await cmd.execute({}, mockContext);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]?.name).toBe("default");
  });
});

describe("KeystoreDeleteSubCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects deletion without --force", async () => {
    const { readRegistry } = await import("../../commands/keystore/registry.js");
    const { KeystoreDeleteSubCommand } = await import(
      "../../commands/keystore/delete.js"
    );

    vi.mocked(readRegistry).mockResolvedValue([
      { name: "myks", path: "/custom/ks" },
    ]);

    const cmd = new KeystoreDeleteSubCommand();
    const result = await cmd.execute({ name: "myks", force: false }, mockContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain("--force");
  });

  it("deletes keystore directory and removes registry entry with --force", async () => {
    const fs = await import("node:fs/promises");
    const { readRegistry, writeRegistry } = await import(
      "../../commands/keystore/registry.js"
    );
    const { KeystoreDeleteSubCommand } = await import(
      "../../commands/keystore/delete.js"
    );

    vi.mocked(readRegistry).mockResolvedValue([
      { name: "myks", path: "/custom/ks" },
    ]);
    vi.mocked(fs.default.rm).mockResolvedValue(undefined);
    vi.mocked(writeRegistry).mockResolvedValue(undefined);

    const cmd = new KeystoreDeleteSubCommand();
    const result = await cmd.execute({ name: "myks", force: true }, mockContext);

    expect(result.success).toBe(true);
    expect(fs.default.rm).toHaveBeenCalledWith("/custom/ks", {
      recursive: true,
      force: true,
    });
    expect(writeRegistry).toHaveBeenCalledWith(expect.any(String), []);
  });

  it("returns error when keystore name not found", async () => {
    const { readRegistry } = await import("../../commands/keystore/registry.js");
    const { KeystoreDeleteSubCommand } = await import(
      "../../commands/keystore/delete.js"
    );

    vi.mocked(readRegistry).mockResolvedValue([]);

    const cmd = new KeystoreDeleteSubCommand();
    const result = await cmd.execute({ name: "missing", force: true }, mockContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });
});
