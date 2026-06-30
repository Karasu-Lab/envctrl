/** A package discovered within a monorepo workspace. */
export interface WorkspacePackage {
  readonly name: string;
  readonly path: string;
}

/** Persisted configuration stored in `.envctrl/config.json`. */
export interface EnvctrlConfig {
  /** Currently active environment name (e.g. `"development"`, `"production"`). */
  readonly environment: string;
}

/** Result of the `init` command. */
export interface InitResult {
  readonly workspaceRoot: string;
  readonly packages: WorkspacePackage[];
  readonly keystorePath: string;
  readonly keysLinked: string[];
  /** Absolute path to the written `.envctrl/config.json` file. */
  readonly configPath: string;
  /** The environment recorded in the config. */
  readonly environment: string;
  /** True when the environment was resolved from a detected CI/CD provider. */
  readonly autoDetected: boolean;
  /** True when `.gitignore` was updated with envctrl patterns. */
  readonly gitignoreUpdated: boolean;
}
