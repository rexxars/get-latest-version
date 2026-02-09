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
