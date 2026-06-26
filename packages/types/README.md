# @envctrl/types

TypeScript type definitions for the envctrl ecosystem.

## Installation

```sh
npm install @envctrl/types
```

## Types

### Command infrastructure

#### `ISubCommand<TOptions, TResult>`

Contract every concrete subcommand must satisfy.

```ts
interface ISubCommand<TOptions, TResult> {
  execute(options: TOptions, context: CommandContext): Promise<CommandResult<TResult>>;
}
```

#### `CommandContext`

Runtime context injected into every subcommand execution.

```ts
interface CommandContext {
  readonly cwd: string;
  readonly quiet: boolean;
}
```

#### `CommandResult<T>`

Uniform result envelope returned from every subcommand.

```ts
interface CommandResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}
```

---

### Environment

#### `EnvironmentName`

A validated environment name token (e.g. `"development"`, `"production"`).

```ts
type EnvironmentName = string;
```

#### `EnvFilePair`

The pair of files backing one named environment.

```ts
interface EnvFilePair {
  readonly environment: EnvironmentName;
  readonly unencrypted: string; // .env.[env].unencrypted
  readonly encrypted: string;   // .env.[env]
}
```

#### `SwitchResult`

```ts
interface SwitchResult {
  readonly environment: EnvironmentName;
  readonly created: string[];
  readonly activePath: string;
}
```

#### `SetResult`

```ts
interface SetResult {
  readonly environment: EnvironmentName;
  readonly key: string;
  readonly changed: boolean;
}
```

#### `EncryptResult`

```ts
interface EncryptResult {
  readonly changedFiles: string[];
  readonly unchangedFiles: string[];
}
```

---

### Keystore

#### `KeystoreEntry`

A named keystore entry as returned by `keystore list`.

```ts
interface KeystoreEntry {
  readonly name: string;
  readonly path: KeystorePath;
}
```

#### `KeystoreConfig`

Configuration for a keystore instance.

```ts
interface KeystoreConfig {
  readonly path: KeystorePath;
}
```

#### `KeystoreAction`

```ts
type KeystoreAction = 'create' | 'list' | 'delete';
```

---

### dotenvx

#### `DotenvxSetResult`

```ts
interface DotenvxSetResult {
  readonly changedFilepaths: string[];
  readonly unchangedFilepaths: string[];
}
```

#### `DotenvxEncryptResult`

```ts
interface DotenvxEncryptResult {
  readonly changedFilepaths: string[];
  readonly unchangedFilepaths: string[];
}
```
