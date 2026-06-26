/** Absolute path to a keystore directory. */
export type KeystorePath = string;

/** A named keystore entry as returned by list. */
export interface KeystoreEntry {
  readonly name: string;
  readonly path: KeystorePath;
}

/** Configuration for a keystore instance. */
export interface KeystoreConfig {
  readonly path: KeystorePath;
}

/** The three actions the keystore command dispatches. */
export type KeystoreAction = 'create' | 'list' | 'delete';
