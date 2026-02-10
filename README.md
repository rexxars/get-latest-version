# get-latest-version

Find the latest version of an npm module matching a given semver range

[![npm version](https://img.shields.io/npm/v/get-latest-version.svg?style=flat-square)](https://www.npmjs.com/package/get-latest-version)[![Build status](https://img.shields.io/github/actions/workflow/status/rexxars/get-latest-version/test.yml?branch=main&style=flat-square)](https://github.com/rexxars/get-latest-version/actions/workflows/test.yml)

## Requirements

- Node.js 20 or higher
- This package is now ESM-only and uses named exports. If you need CommonJS support, use version 5.x.

## Installing

```
npm install --save get-latest-version
```

## Basic usage

```js
import {getLatestVersion} from 'get-latest-version'

// Get the latest version
try {
  const version = await getLatestVersion('some-module')
  console.log(version) // 1.0.0, or whichever is 'latest'
} catch (err) {
  console.error(err)
}

// Get highest version matching a semver range
try {
  const version = await getLatestVersion('some-other-module', {range: '^1.0.0'})
  console.log(version) // highest version matching ^1.0.0 range
} catch (err) {
  console.error(err)
}

// Returns both the highest in the given range and the actual `latest` tag
// Note that this differs in that the return value is an object
try {
  const versions = await getLatestVersion('@sanity/base', {range: '^1.0.0', includeLatest: true})
  console.log(versions) // {inRange: '1.150.8', latest: '2.23.0'}
} catch (err) {
  console.error(err)
}
```

## Disabling authenticated requests

By default, this module will read the authorization token for whichever registry the module belongs to, based on local npm configuration. To disable this and always send unauthenticated requests to the registry, provide `auth: false` to the options:

```js
import {getLatestVersion} from 'get-latest-version'

try {
  const version = await getLatestVersion('some-module', {auth: false})
  console.log(version)
} catch (err) {
  console.error(err)
}
```

## Using custom registry

By default, module utilizes [registry-url](https://www.npmjs.com/package/registry-url) to resolve registry URL from NPM configuration files. However, if you need to set up the registry programmatically, you can make use of the `registryUrl` option:

```js
import {getLatestVersion} from 'get-latest-version'

try {
  const version = await getLatestVersion('some-module', {
    registryUrl: 'https://some-custom-registry.com'
  })
  console.log(version)
} catch (err) {
  console.error(err)
}
```

## Canceling requests with AbortSignal

You can cancel in-flight requests using an `AbortController`. This is useful for implementing timeouts, canceling requests.

```js
import {getLatestVersion} from 'get-latest-version'

// Cancel a request with a timeout
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

try {
  const version = await getLatestVersion('some-module', {signal: controller.signal})
  clearTimeout(timeoutId)
  console.log(version)
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Request was canceled')
  } else {
    console.error(err)
  }
}
```

**Note:** Aborted requests are not retried, ensuring immediate cancellation.

## Advanced Options

### Custom Request Function (for testing)

The `request` option allows you to provide a custom HTTP request function for testing purposes:

```js
import {getLatestVersion} from 'get-latest-version'

// Mock request function for testing
const mockRequest = async ({url}) => ({
  body: {
    'dist-tags': {latest: '1.0.0'},
    versions: {'1.0.0': {}},
  },
  statusCode: 200,
})

const version = await getLatestVersion('lodash', {request: mockRequest})
// => '1.0.0'
```

**Note:** This is an advanced option primarily intended for testing. The default HTTP client handles retries, error handling, and proper response parsing.

## Developing

```bash
git clone git@github.com:rexxars/get-latest-version.git
cd get-latest-version
npm install
npm test
```

## License

MIT © [Espen Hovlandsdal](https://espen.codes/)
