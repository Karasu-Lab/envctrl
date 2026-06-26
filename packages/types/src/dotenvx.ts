/** Result of a dotenvx set operation mirrored from SetOutput. */
export interface DotenvxSetResult {
  readonly changedFilepaths: string[];
  readonly unchangedFilepaths: string[];
}

/** Result of a dotenvx encrypt operation. */
export interface DotenvxEncryptResult {
  readonly changedFilepaths: string[];
  readonly unchangedFilepaths: string[];
}
