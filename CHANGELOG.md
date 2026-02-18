<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.0.1](https://github.com/rexxars/get-latest-version/compare/v6.0.0...v6.0.1) (2026-02-18)

### Bug Fixes

- `url.parse()` deprecation warning ([6936f40](https://github.com/rexxars/get-latest-version/commit/6936f4032f1fca3e47cd7728d95a583efca69770))

## [6.0.0](https://github.com/rexxars/get-latest-version/compare/v5.1.0...v6.0.0) (2026-02-10)

### ⚠ BREAKING CHANGES

- Node.js 20 is now the minimum supported version
- import syntax changed from default to named exports
- Package is now ESM-only.

### Features

- make node20 minimum supported version ([6cef37c](https://github.com/rexxars/get-latest-version/commit/6cef37cbba6549f15cb9cd45ceeb6d69d0be8be6))
- migrate to ESM and upgrade dependencies ([7ea6d92](https://github.com/rexxars/get-latest-version/commit/7ea6d9291adaab2d4d97cf95bd588a144622420a))
- switch to named exports for better IDE support ([7ef60e7](https://github.com/rexxars/get-latest-version/commit/7ef60e71fcff534c774fe12feb431f9bf24e493f))

# 6.0.0

- **BREAKING:** Package is now ESM-only and uses named exports. Use `import {getLatestVersion} from 'get-latest-version'` instead of `import getLatestVersion from 'get-latest-version'` or `require('get-latest-version')`
- **BREAKING:** Minimum Node.js version is now 20 (previously 14.18)

# 5.1.0

- Added new `registryUrl` option

# 5.0.1

- Fixed a bug where getting the latest version might crash when an invalid npmrc file was found

# 5.0.0

- **BREAKING:** Require node.js version 14.18 or higher

# 4.0.0

- **BREAKING:** Now returns `undefined` if no version in range can be found, instead of throwing

# 3.0.2

- Added TypeScript definition

# 3.0.1

- Fixed bug where object form (including `latest`) would not be returned on direct version matches

# 3.0.0

- **BREAKING:** Require node.js version 12 or higher
- Added new `includeLatest` option
