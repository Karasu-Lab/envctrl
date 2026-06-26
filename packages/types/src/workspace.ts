/** A package discovered within a monorepo workspace. */
export interface WorkspacePackage {
  readonly name: string;
  readonly path: string;
}

/** Result of the `init` command. */
export interface InitResult {
  readonly workspaceRoot: string;
  readonly packages: WorkspacePackage[];
  readonly keystorePath: string;
  readonly keysLinked: string[];
}
