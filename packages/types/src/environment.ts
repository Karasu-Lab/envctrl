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

/** Result of a list operation showing discovered environment names. */
export interface ListResult {
  readonly environments: EnvironmentName[];
}

/** Result of an rm operation. */
export interface RemoveResult {
  readonly environment: EnvironmentName;
  readonly deletedFiles: string[];
}

/** Result of a blacklist add or remove operation. */
export interface BlacklistResult {
  readonly environment: EnvironmentName;
  readonly blacklisted: EnvironmentName[];
}
