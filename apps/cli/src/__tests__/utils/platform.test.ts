import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";

describe("resolveDefaultKeystorePath", () => {
  const originalPlatform = process.platform;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.spyOn(os, "homedir").mockReturnValue("/home/testuser");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(process, "platform", { value: originalPlatform });
    process.env = { ...originalEnv };
  });

  it("returns XDG_DATA_HOME path on Linux when set", async () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    process.env["XDG_DATA_HOME"] = "/custom/data";

    const { resolveDefaultKeystorePath } = await import(
      "../../utils/platform.js"
    );
    expect(resolveDefaultKeystorePath()).toBe(
      "/custom/data/envctrl/keystores/default"
    );
  });

  it("returns fallback ~/.local/share path on Linux without XDG_DATA_HOME", async () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    delete process.env["XDG_DATA_HOME"];

    const { resolveDefaultKeystorePath } = await import(
      "../../utils/platform.js"
    );
    expect(resolveDefaultKeystorePath()).toBe(
      path.join("/home/testuser", ".local", "share", "envctrl", "keystores", "default")
    );
  });

  it("returns macOS Application Support path on darwin", async () => {
    Object.defineProperty(process, "platform", { value: "darwin" });

    const { resolveDefaultKeystorePath } = await import(
      "../../utils/platform.js"
    );
    expect(resolveDefaultKeystorePath()).toBe(
      path.join("/home/testuser", "Library", "Application Support", "envctrl", "keystores", "default")
    );
  });
});
