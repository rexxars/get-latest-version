const {injectResponse} = require('get-it/middleware')
const getLatestVersion = require('../')

const versionPattern = /^\d+\.\d+\.\d+$/
const shouldNotResolve = () => {
  throw new Error('Should not resolve')
}

test('can get latest version', () =>
  expect(getLatestVersion('npm')).resolves.toMatch(versionPattern))

test('can get latest in range (string option)', () =>
  expect(getLatestVersion('npm', '^1.0.0')).resolves.toBe('1.4.29'))

test('can get latest in range (options object)', () =>
  expect(getLatestVersion('npm', {range: '^1.0.0'})).resolves.toBe('1.4.29'))

test('can get specific version', () =>
  expect(getLatestVersion('npm', '1.4.29')).resolves.toBe('1.4.29'))

test('can opt-out of sending auth info', () =>
  expect(getLatestVersion('npm', {range: '^1.0.0', auth: false})).resolves.toBe('1.4.29'))

test('can use custom registry', () => {
  const inject = (evt) => {
    expect(evt.context.options.url).toBe('https://custom-registry.npmjs.org/@some-scope%2Fsome-library')
    return { body: { 'dist-tags': { latest: '1.0.0' }} }
  }
  const request = getLatestVersion.request.clone().use(injectResponse({inject}))
  return getLatestVersion('@some-scope/some-library', {
    request,
    registryUrl: 'https://custom-registry.npmjs.org/'
  })
})

test('rejects with package not found error', () =>
  getLatestVersion('##invalid##')
    .then(shouldNotResolve)
    .catch((err) => expect(err.message).toMatch(/doesn't exist/i)))

test('retries on 500-errors', () => {
  let tries = 0
  const inject = (evt, prev) => (++tries === 1 ? {statusCode: 500} : null)
  const request = getLatestVersion.request.clone().use(injectResponse({inject}))
  return expect(getLatestVersion('npm', {request})).resolves.toMatch(versionPattern)
})

test('can include latest alongside in range', async () => {
  const {inRange, latest} = await getLatestVersion('npm', {
    range: '^1.0.0',
    includeLatest: true,
  })

  expect(inRange).toBe('1.4.29')
  expect(latest).toMatch(versionPattern)
  expect(latest).not.toBe('1.4.29')
})

test('can include latest alongside in range (mocked)', () => {
  const inject = () => ({
    body: {
      'dist-tags': {latest: '2.0.0', beta: '3.0.0-beta.0'},
      versions: {
        '1.0.0': {name: 'get-latest-version', version: '1.0.0'},
        '1.1.0': {name: 'get-latest-version', version: '1.1.0'},
        '1.2.0': {name: 'get-latest-version', version: '1.2.0'},
        '2.0.0': {name: 'get-latest-version', version: '1.2.0'},
        '3.0.0-beta.0': {name: 'get-latest-version', version: '3.0.0-beta.0'},
      },
    },
  })
  const request = getLatestVersion.request.clone().use(injectResponse({inject}))
  return expect(
    getLatestVersion('get-latest-version', {
      request,
      range: '^1.0.0',
      includeLatest: true,
    })
  ).resolves.toEqual({
    inRange: '1.2.0',
    latest: '2.0.0',
  })
})

test('can include latest alongside in range (with exact tag match)', () => {
  const inject = () => ({
    body: {
      'dist-tags': {latest: '2.0.0', beta: '3.0.0-beta.0'},
      versions: {
        '1.0.0': {name: 'get-latest-version', version: '1.0.0'},
        '1.1.0': {name: 'get-latest-version', version: '1.1.0'},
        '1.2.0': {name: 'get-latest-version', version: '1.2.0'},
        '2.0.0': {name: 'get-latest-version', version: '1.2.0'},
        '3.0.0-beta.0': {name: 'get-latest-version', version: '3.0.0-beta.0'},
      },
    },
  })
  const request = getLatestVersion.request.clone().use(injectResponse({inject}))
  return expect(
    getLatestVersion('get-latest-version', {
      request,
      range: 'beta',
      includeLatest: true,
    })
  ).resolves.toEqual({
    inRange: '3.0.0-beta.0',
    latest: '2.0.0',
  })
})

test('can include latest alongside in range (with exact version match)', () => {
  const inject = () => ({
    body: {
      'dist-tags': {latest: '2.0.0', beta: '3.0.0-beta.0'},
      versions: {
        '1.0.0': {name: 'get-latest-version', version: '1.0.0'},
        '1.1.0': {name: 'get-latest-version', version: '1.1.0'},
        '1.2.0': {name: 'get-latest-version', version: '1.2.0'},
        '2.0.0': {name: 'get-latest-version', version: '1.2.0'},
        '3.0.0-beta.0': {name: 'get-latest-version', version: '3.0.0-beta.0'},
      },
    },
  })
  const request = getLatestVersion.request.clone().use(injectResponse({inject}))
  return expect(
    getLatestVersion('get-latest-version', {
      request,
      range: '1.2.0',
      includeLatest: true,
    })
  ).resolves.toEqual({
    inRange: '1.2.0',
    latest: '2.0.0',
  })
})

test('returns undefined if range cannot be satisfied', () =>
  expect(getLatestVersion('react-markdown', '^1888.0.0')).resolves.toBe(undefined))

test('returns undefined but includes latest if range cannot be satisfied in `includeLatest` mode', async () => {
  const versions = await getLatestVersion('@sanity/components', {
    range: 'lol-non-existant-tag',
    includeLatest: true,
  })
  expect(versions.inRange).toBe(undefined)
  expect(versions.latest).toMatch(/^\d+.\d+.\d+$/)
})
