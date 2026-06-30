# Changelog

## [1.9.1](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.9.0...cli-v1.9.1) (2026-06-30)


### Bug Fixes

* move install.sh and uninstall.sh into apps/cli ([c6fee42](https://github.com/Karasu-Lab/envctrl/commit/c6fee42f2a58e8f3eaf8d59556ba9cb99f84f1ad))
* move install.sh and uninstall.sh into apps/cli ([f3b2517](https://github.com/Karasu-Lab/envctrl/commit/f3b251744996a9f9449b6f5a2a89e182262dd018))

## [1.9.0](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.8.1...cli-v1.9.0) (2026-06-30)


### Features

* prompt user to configure .gitignore during init ([66d214e](https://github.com/Karasu-Lab/envctrl/commit/66d214e1447d2a97295138a38a9ab13a20470c49))
* prompt user to configure .gitignore during init ([452f852](https://github.com/Karasu-Lab/envctrl/commit/452f8527b6e3b8ff21856b47e80b535bddda8f1b))

## [1.8.1](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.8.0...cli-v1.8.1) (2026-06-30)


### Bug Fixes

* preserve comments and blank lines when creating env from base ([7268fa2](https://github.com/Karasu-Lab/envctrl/commit/7268fa2eecc48115b80c5557a88d8f65c92bf962))
* preserve comments and blank lines when creating env from base ([16a9c8c](https://github.com/Karasu-Lab/envctrl/commit/16a9c8cfd3b6029727eb9058da5325e771f3e6c5))

## [1.8.0](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.7.0...cli-v1.8.0) (2026-06-29)


### Features

* support --from flag on create to copy key names from a base environment ([5ac7c1a](https://github.com/Karasu-Lab/envctrl/commit/5ac7c1a38d4bc1a4c7fc14ef8ece028b973ae32d))
* support --from flag on create to copy key names from a base environment ([be8fa0c](https://github.com/Karasu-Lab/envctrl/commit/be8fa0c536c01d568ae2a3ff8cde56ddd3d92485))

## [1.7.0](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.6.0...cli-v1.7.0) (2026-06-29)


### Features

* add create command for environment scaffolding and .env.example generation ([3c77332](https://github.com/Karasu-Lab/envctrl/commit/3c77332767451930ac7915cde045531c055bccd5))
* add create command for environment scaffolding and .env.example generation ([97c82b3](https://github.com/Karasu-Lab/envctrl/commit/97c82b3f59978ee75358b94b0131a85f92d4cc64))

## [1.6.0](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.5.0...cli-v1.6.0) (2026-06-29)


### Features

* create .envctrl/config.json on init with build env auto-detection ([4183049](https://github.com/Karasu-Lab/envctrl/commit/41830496e0407e3649582a58eff041fe46076952))
* create .envctrl/config.json on init with build env auto-detection ([36f1698](https://github.com/Karasu-Lab/envctrl/commit/36f16983f179c740b5ebf05470e8c07c81ca0de4))

## [1.5.0](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.4.2...cli-v1.5.0) (2026-06-26)


### Features

* show version at top of help output ([291518f](https://github.com/Karasu-Lab/envctrl/commit/291518fb92581ba1a1db51a3d6f3da7c2fcc5d67))
* show version at top of help output ([0f89bd2](https://github.com/Karasu-Lab/envctrl/commit/0f89bd2ed1f71c92ff67c0375aa95d1783200742))

## [1.4.2](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.4.1...cli-v1.4.2) (2026-06-26)


### Bug Fixes

* skip .env.keys symlink in directories with no env files ([4ebb244](https://github.com/Karasu-Lab/envctrl/commit/4ebb24462e226af0f9f9f293441c296f33f2294d))

## [1.4.1](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.4.0...cli-v1.4.1) (2026-06-26)


### Bug Fixes

* suppress dotenvx internal output during set operations ([9281234](https://github.com/Karasu-Lab/envctrl/commit/9281234bd2110f8fce4b2feb2b1ecd1615476505))
* suppress dotenvx internal output during set operations ([7ca256d](https://github.com/Karasu-Lab/envctrl/commit/7ca256d87be62b85e30c029d404afb81d21b33e8))

## [1.4.0](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.3.0...cli-v1.4.0) (2026-06-26)


### Features

* add list, rm, blacklist commands with formatted English output ([2b97bdf](https://github.com/Karasu-Lab/envctrl/commit/2b97bdf585b4f7059c0799fc3c5854deeeade560))
* add rm and blacklist commands, switch output to formatted English text ([dce1aab](https://github.com/Karasu-Lab/envctrl/commit/dce1aab9d6c345293a446612fe899392348836b2))

## [1.3.0](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.2.0...cli-v1.3.0) (2026-06-26)


### Features

* add list command and support .local env file patterns ([f5d69e6](https://github.com/Karasu-Lab/envctrl/commit/f5d69e67f0e2ae301e09f2f3712f21f37fd71b6d))
* add list command and support .local env file patterns ([8099b39](https://github.com/Karasu-Lab/envctrl/commit/8099b395cd9f293a2298b9d01e7708f564e5b26c))

## [1.2.0](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.1.0...cli-v1.2.0) (2026-06-26)


### Features

* add init command to scan workspace and link shared keystore ([00f9ec9](https://github.com/Karasu-Lab/envctrl/commit/00f9ec9b9d134a4cdf3928f28595ad36dfca66ee))
* add init command to scan workspace and link shared keystore ([87b48fc](https://github.com/Karasu-Lab/envctrl/commit/87b48fc8224a86c34726074aa1b8ec1782a3db06))

## [1.1.0](https://github.com/Karasu-Lab/envctrl/compare/cli-v1.0.0...cli-v1.1.0) (2026-06-26)


### Features

* add prettier for code formatting ([50cd8a6](https://github.com/Karasu-Lab/envctrl/commit/50cd8a6b7812ea820a5110558788c4009562e10c))
* add prettier for code formatting ([520da5b](https://github.com/Karasu-Lab/envctrl/commit/520da5b6a677458e2dcd710fe4a80d4ed253447b))

## 1.0.0 (2026-06-26)


### Features

* add cli package ([e5d6745](https://github.com/Karasu-Lab/envctrl/commit/e5d67459d7f959ef893cd57a807a9ff9eacae6eb))
* add cli package ([834210a](https://github.com/Karasu-Lab/envctrl/commit/834210aa2a302cf4a1d9bc394fb7614dbc614c40))

## Changelog
