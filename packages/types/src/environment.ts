/** A validated environment name token, e.g. "development", "production". */
export type EnvironmentName = string;

/**
 * Represents the pair of files that back one named environment.
 * - `unencrypted`: `.env.[env].unencrypted` — the human-editable plaintext source
 * - `encrypted`: `.env.[env]` — the dotenvx-encrypted file committed to VCS
 */
export interface EnvFilePair {
  readonly environment: EnvironmentName;
  readonly unencrypted: string;
  readonly encrypted: string;
}

/** Outcome of a switch operation. */
export interface SwitchResult {
  readonly environment: EnvironmentName;
  readonly created: string[];
  readonly activePath: string;
}

/** Result of a set operation on a single key. */
export interface SetResult {
  readonly environment: EnvironmentName;
  readonly key: string;
  readonly changed: boolean;
}

/** Result of a bulk encrypt operation. */
export interface EncryptResult {
  readonly changedFiles: string[];
  readonly unchangedFiles: string[];
}
