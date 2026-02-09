import {injectResponse} from 'get-it/middleware'
import assert from 'node:assert/strict'
import {test} from 'node:test'

import {getLatestVersion} from '../src/index.js'

const versionPattern = /^\d+\.\d+\.\d+$/

test('can get latest version', async () => {
  assert.match(await getLatestVersion('npm'), versionPattern)
})

test('can get latest in range (string option)', async () => {
  assert.strictEqual(await getLatestVersion('npm', '^1.0.0'), '1.4.29')
})

test('can get latest in range (options object)', async () => {
  assert.strictEqual(await getLatestVersion('npm', {range: '^1.0.0'}), '1.4.29')
})

test('can get specific version', async () => {
  assert.strictEqual(await getLatestVersion('npm', '1.4.29'), '1.4.29')
})

test('can opt-out of sending auth info', async () => {
  assert.strictEqual(
    await getLatestVersion('npm', {auth: false, range: '^1.0.0'}),
    '1.4.29',
  )
})

test('can use custom registry', async () => {
  const inject = (evt) => {
    assert.strictEqual(
      evt.context.options.url,
      'https://custom-registry.npmjs.org/@some-scope%2Fsome-library',
    )
    return {body: {'dist-tags': {latest: '1.0.0'}}}
  }
  const request = getLatestVersion.request.clone().use(injectResponse({inject}))
  await getLatestVersion('@some-scope/some-library', {
    registryUrl: 'https://custom-registry.npmjs.org/',
    request,
  })
})

test('rejects with package not found error', async () => {
  await assert.rejects(getLatestVersion('##invalid##'), /doesn't exist/i)
})

test('retries on 500-errors', async () => {
  let tries = 0
  const inject = (_evt, _prev) => (++tries === 1 ? {statusCode: 500} : null)
  const request = getLatestVersion.request.clone().use(injectResponse({inject}))
  assert.match(await getLatestVersion('npm', {request}), versionPattern)
})

test('can include latest alongside in range', async () => {
  const {inRange, latest} = await getLatestVersion('npm', {
    includeLatest: true,
    range: '^1.0.0',
  })

  assert.strictEqual(inRange, '1.4.29')
  assert.match(latest, versionPattern)
  assert.notStrictEqual(latest, '1.4.29')
})

test('can include latest alongside in range (mocked)', async () => {
  const inject = () => ({
    body: {
      'dist-tags': {beta: '3.0.0-beta.0', latest: '2.0.0'},
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
  const result = await getLatestVersion('get-latest-version', {
    includeLatest: true,
    range: '^1.0.0',
    request,
  })
  assert.deepStrictEqual(result, {
    inRange: '1.2.0',
    latest: '2.0.0',
  })
})

test('can include latest alongside in range (with exact tag match)', async () => {
  const inject = () => ({
    body: {
      'dist-tags': {beta: '3.0.0-beta.0', latest: '2.0.0'},
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
  const result = await getLatestVersion('get-latest-version', {
    includeLatest: true,
    range: 'beta',
    request,
  })
  assert.deepStrictEqual(result, {
    inRange: '3.0.0-beta.0',
    latest: '2.0.0',
  })
})

test('can include latest alongside in range (with exact version match)', async () => {
  const inject = () => ({
    body: {
      'dist-tags': {beta: '3.0.0-beta.0', latest: '2.0.0'},
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
  const result = await getLatestVersion('get-latest-version', {
    includeLatest: true,
    range: '1.2.0',
    request,
  })
  assert.deepStrictEqual(result, {
    inRange: '1.2.0',
    latest: '2.0.0',
  })
})

test('returns undefined if range cannot be satisfied', async () => {
  assert.strictEqual(await getLatestVersion('react-markdown', '^1888.0.0'), undefined)
})

test('returns undefined but includes latest if range cannot be satisfied in `includeLatest` mode', async () => {
  const versions = await getLatestVersion('@sanity/components', {
    includeLatest: true,
    range: 'lol-non-existant-tag',
  })
  assert.strictEqual(versions.inRange, undefined)
  assert.match(versions.latest, /^\d+.\d+.\d+$/)
})
