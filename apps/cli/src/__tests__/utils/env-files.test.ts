import { describe, it, expect } from "vitest";
import {
  parseEnvironmentFromFilename,
  buildEnvFilePair,
  parseEnvContent,
  upsertEnvLine,
} from "../../utils/env-files.js";

describe("parseEnvironmentFromFilename", () => {
  it("extracts environment from .env.development", () => {
    expect(parseEnvironmentFromFilename(".env.development")).toBe("development");
  });

  it("extracts environment from .env.production", () => {
    expect(parseEnvironmentFromFilename(".env.production")).toBe("production");
  });

  it("strips .unencrypted suffix", () => {
    expect(parseEnvironmentFromFilename(".env.production.unencrypted")).toBe(
      "production"
    );
  });

  it("returns undefined for bare .env", () => {
    expect(parseEnvironmentFromFilename(".env")).toBeUndefined();
  });

  it("returns undefined for .env.keys", () => {
    expect(parseEnvironmentFromFilename(".env.keys")).toBeUndefined();
  });

  it("works with full paths by using basename", () => {
    expect(parseEnvironmentFromFilename("/project/.env.staging")).toBe("staging");
  });
});

describe("buildEnvFilePair", () => {
  it("returns correct absolute paths for both files", () => {
    const pair = buildEnvFilePair("test", "/project");
    expect(pair.environment).toBe("test");
    expect(pair.encrypted).toBe("/project/.env.test");
    expect(pair.unencrypted).toBe("/project/.env.test.unencrypted");
  });
});

describe("parseEnvContent", () => {
  it("parses KEY=VALUE pairs", () => {
    const result = parseEnvContent("FOO=bar\nBAZ=qux\n");
    expect(result).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("ignores comment lines", () => {
    const result = parseEnvContent("# comment\nFOO=bar\n");
    expect(result).toEqual({ FOO: "bar" });
  });

  it("ignores blank lines", () => {
    const result = parseEnvContent("\nFOO=bar\n\n");
    expect(result).toEqual({ FOO: "bar" });
  });

  it("handles values containing =", () => {
    const result = parseEnvContent("URL=https://example.com?a=1\n");
    expect(result["URL"]).toBe("https://example.com?a=1");
  });

  it("returns empty object for empty content", () => {
    expect(parseEnvContent("")).toEqual({});
  });
});

describe("upsertEnvLine", () => {
  it("appends a new key to empty content", () => {
    const result = upsertEnvLine("", "FOO", "bar");
    expect(result).toContain("FOO=bar");
  });

  it("replaces an existing key", () => {
    const result = upsertEnvLine("FOO=old\nBAR=baz\n", "FOO", "new");
    expect(result).toContain("FOO=new");
    expect(result).not.toContain("FOO=old");
    expect(result).toContain("BAR=baz");
  });

  it("appends a new key to existing content", () => {
    const result = upsertEnvLine("FOO=bar\n", "NEW", "value");
    expect(result).toContain("FOO=bar");
    expect(result).toContain("NEW=value");
  });
});
