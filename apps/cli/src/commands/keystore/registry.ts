import fs from "node:fs/promises";
import type { KeystoreEntry } from "@envctrl/types";

/**
 * Reads the keystores registry JSON file.
 *
 * Returns an empty array if the file does not exist yet.
 *
 * @param registryPath - Absolute path to the `keystores.json` file
 */
export async function readRegistry(registryPath: string): Promise<KeystoreEntry[]> {
  try {
    const raw = await fs.readFile(registryPath, "utf8");
    return JSON.parse(raw) as KeystoreEntry[];
  } catch {
    return [];
  }
}

/**
 * Writes the keystores registry to disk.
 *
 * @param registryPath - Absolute path to the `keystores.json` file
 * @param entries - Array of keystore entries to persist
 */
export async function writeRegistry(
  registryPath: string,
  entries: KeystoreEntry[]
): Promise<void> {
  await fs.writeFile(registryPath, JSON.stringify(entries, null, 2) + "\n", "utf8");
}
