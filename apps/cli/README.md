# @envctrl/cli

Encrypted environment file manager built on [dotenvx](https://dotenvx.com).

Manages named environments by keeping a human-editable plaintext source (`.env.[env].unencrypted`) in sync with a dotenvx-encrypted file (`.env.[env]`) that is safe to commit to version control.

## Installation

```sh
npm install -g @envctrl/cli
```

## Commands

### `switch <environment>`

Creates, syncs, and activates a named environment.

- Creates `.env.[env].unencrypted` and `.env.[env]` if they do not exist.
- Syncs keys from the unencrypted source into the encrypted file.
- Points `.env` at the encrypted file via symlink (POSIX) or file copy (Windows).

```sh
envctrl switch development
envctrl switch production
```

### `set <environment> <key> <value>`

Sets a single environment variable and keeps both files in sync.

Writes the key to `.env.[env].unencrypted` first as the human-readable source of truth, then calls `dotenvx set` to write and encrypt the value in `.env.[env]`.

```sh
envctrl set development DATABASE_URL "postgres://localhost/mydb"
envctrl set production API_KEY "sk-..."
```

### `encrypt [files...]`

Encrypts existing plaintext `.env.*` files in-place using dotenvx.

For each file, the original plaintext content is backed up to `.env.[env].unencrypted` before encryption. If no files are given, all `.env.*` files in the working directory are encrypted (excluding `.env.keys` and `*.unencrypted` files).

```sh
envctrl encrypt
envctrl encrypt .env.staging .env.production
```

### `keystore create [path]`

Creates a new keystore directory and registers it in the global registry. Defaults to the platform application data folder if no path is given.

```sh
envctrl keystore create
envctrl keystore create /path/to/keys --name my-project
```

| Option | Description |
|--------|-------------|
| `-n, --name <name>` | Name for the keystore entry in the registry |

### `keystore list`

Lists all registered keystores.

```sh
envctrl keystore list
```

### `keystore delete <name>`

Deletes a named keystore directory and removes it from the registry. Requires `--force` to confirm deletion.

```sh
envctrl keystore delete my-project --force
```

| Option | Description |
|--------|-------------|
| `--force` | Skip confirmation and delete immediately |

## Global Options

| Option | Description |
|--------|-------------|
| `-q, --quiet` | Suppress output |
| `-V, --version` | Print version |
| `-h, --help` | Display help |

## How It Works

envctrl maintains two files per environment:

| File | Purpose |
|------|---------|
| `.env.[env].unencrypted` | Human-editable plaintext source, **do not commit** |
| `.env.[env]` | dotenvx-encrypted file, safe to commit |

The active environment is exposed as `.env` (symlink on POSIX, copy on Windows), which dotenvx decrypts at runtime using keys stored in the keystore.
