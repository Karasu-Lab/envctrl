# @envctrl/types

TypeScript type definitions for the envctrl ecosystem.

## Installation

```sh
npm install @envctrl/types
```

## Overview

This package exports shared types used across the envctrl toolchain.

| Module | Contents |
|--------|----------|
| Command | `ISubCommand`, `CommandContext`, `CommandResult` — subcommand contract and result envelope |
| Environment | `EnvFilePair`, `SwitchResult`, `SetResult`, `EncryptResult` — environment file operations |
| Keystore | `KeystoreEntry`, `KeystoreConfig`, `KeystoreAction` — keystore management |
| dotenvx | `DotenvxSetResult`, `DotenvxEncryptResult` — dotenvx operation results |
