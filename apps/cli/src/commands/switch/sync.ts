import fs from "node:fs/promises";
import { parseEnvContent, buildEnvFilePair } from "../../utils/env-files.js";
import { setKeyValue } from "../../utils/dotenvx.js";
import type { EnvironmentName } from "@envctrl/types";

/**
 * Syncs all keys from the unencrypted file into the encrypted file.
 *
 * Reads the plaintext `.env.[env].unencrypted` file and calls dotenvx `set`
 * for each key so the encrypted counterpart stays in sync.
 *
 * @param environment - The environment name
 * @param cwd - Working directory containing the env files
 */
export async function syncUnencryptedToEncrypted(
  environment: EnvironmentName,
  cwd: string
): Promise<void> {
  const pair = buildEnvFilePair(environment, cwd);

  let content: string;
  try {
    content = await fs.readFile(pair.unencrypted, "utf8");
  } catch {
    return;
  }

  const entries = parseEnvContent(content);

  for (const [key, value] of Object.entries(entries)) {
    setKeyValue(key, value, pair.encrypted);
  }
}
