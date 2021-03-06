# get-latest-version

Find the latest version of an npm module matching a given semver range

[![npm version](https://img.shields.io/npm/v/get-latest-version.svg?style=flat-square)](http://browsenpm.org/package/get-latest-version)[![Build Status](https://img.shields.io/travis/rexxars/get-latest-version/master.svg?style=flat-square)](https://travis-ci.org/rexxars/get-latest-version)

## Installing

```
npm install --save get-latest-version
```

## Basic usage

```js
const getLatestVersion = require('get-latest-version')

getLatestVersion('some-module')
  .then((version) => console.log(version)) // 1.0.0, or whichever is 'latest'
  .catch((err) => console.error(err))

getLatestVersion('some-other-module', {range: '^1.0.0'})
  .then((version) => console.log(version)) // highest version matching ^1.0.0 range
  .catch((err) => console.error(err))
```

## Disabling authenticated requests

By default, this module will read the authorization token for whichever registry the module belongs to, based on local npm configuration. To disable this and always send unauthenticated requests to the registry, provide `auth: false` to the options:

```js
getLatestVersion('some-module', {auth: false})
  .then((version) => console.log(version))
  .catch((err) => console.error(err))
```

## Developing

```bash
git clone git@github.com:rexxars/get-latest-version.git
cd get-latest-version
npm install
npm test
```

## License

MIT © [Espen Hovlandsdal](https://espen.codes/)
