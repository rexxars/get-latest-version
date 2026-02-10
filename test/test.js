import {http, HttpResponse} from 'msw'
import {setupServer} from 'msw/node'
import assert from 'node:assert/strict'
import {after, afterEach, before, test} from 'node:test'

import {getLatestVersion} from '../src/index.js'

const server = setupServer()

before(() => server.listen({onUnhandledRequest: 'bypass'}))
afterEach(() => server.resetHandlers())
after(() => server.close())

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
  server.use(
    http.get('https://custom-registry.npmjs.org/@some-scope%2Fsome-library', () => {
      return HttpResponse.json({'dist-tags': {latest: '1.0.0'}})
    }),
  )

  const result = await getLatestVersion('@some-scope/some-library', {
    registryUrl: 'https://custom-registry.npmjs.org/',
  })
  assert.strictEqual(result, '1.0.0')
})

test('rejects with package not found error', async () => {
  await assert.rejects(getLatestVersion('##invalid##'), /doesn't exist/i)
})

test('retries on 500-errors', async () => {
  let tries = 0
  server.use(
    http.get('https://registry.npmjs.org/npm', () => {
      if (++tries === 1) {
        return new HttpResponse(null, {status: 500})
      }
      return HttpResponse.json({'dist-tags': {latest: '10.9.0'}})
    }),
  )

  assert.match(await getLatestVersion('npm'), versionPattern)
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
  server.use(
    http.get('https://registry.npmjs.org/get-latest-version', () => {
      return HttpResponse.json({
        'dist-tags': {beta: '3.0.0-beta.0', latest: '2.0.0'},
        versions: {
          '1.0.0': {name: 'get-latest-version', version: '1.0.0'},
          '1.1.0': {name: 'get-latest-version', version: '1.1.0'},
          '1.2.0': {name: 'get-latest-version', version: '1.2.0'},
          '2.0.0': {name: 'get-latest-version', version: '1.2.0'},
          '3.0.0-beta.0': {name: 'get-latest-version', version: '3.0.0-beta.0'},
        },
      })
    }),
  )

  const result = await getLatestVersion('get-latest-version', {
    includeLatest: true,
    range: '^1.0.0',
  })
  assert.deepStrictEqual(result, {
    inRange: '1.2.0',
    latest: '2.0.0',
  })
})

test('can include latest alongside in range (with exact tag match)', async () => {
  server.use(
    http.get('https://registry.npmjs.org/get-latest-version', () => {
      return HttpResponse.json({
        'dist-tags': {beta: '3.0.0-beta.0', latest: '2.0.0'},
        versions: {
          '1.0.0': {name: 'get-latest-version', version: '1.0.0'},
          '1.1.0': {name: 'get-latest-version', version: '1.1.0'},
          '1.2.0': {name: 'get-latest-version', version: '1.2.0'},
          '2.0.0': {name: 'get-latest-version', version: '1.2.0'},
          '3.0.0-beta.0': {name: 'get-latest-version', version: '3.0.0-beta.0'},
        },
      })
    }),
  )

  const result = await getLatestVersion('get-latest-version', {
    includeLatest: true,
    range: 'beta',
  })
  assert.deepStrictEqual(result, {
    inRange: '3.0.0-beta.0',
    latest: '2.0.0',
  })
})

test('can include latest alongside in range (with exact version match)', async () => {
  server.use(
    http.get('https://registry.npmjs.org/get-latest-version', () => {
      return HttpResponse.json({
        'dist-tags': {beta: '3.0.0-beta.0', latest: '2.0.0'},
        versions: {
          '1.0.0': {name: 'get-latest-version', version: '1.0.0'},
          '1.1.0': {name: 'get-latest-version', version: '1.1.0'},
          '1.2.0': {name: 'get-latest-version', version: '1.2.0'},
          '2.0.0': {name: 'get-latest-version', version: '1.2.0'},
          '3.0.0-beta.0': {name: 'get-latest-version', version: '3.0.0-beta.0'},
        },
      })
    }),
  )

  const result = await getLatestVersion('get-latest-version', {
    includeLatest: true,
    range: '1.2.0',
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

test('supports AbortSignal to cancel requests', async () => {
  const controller = new AbortController()

  // Abort immediately
  controller.abort()

  await assert.rejects(getLatestVersion('npm', {signal: controller.signal}), (error) => {
    // Fetch throws DOMException with name 'AbortError' when aborted
    return error.name === 'AbortError' || error.message.includes('abort')
  })
})

test('can abort in-flight requests', async () => {
  const controller = new AbortController()

  // Start a request and abort it after a short delay
  const promise = getLatestVersion('npm', {signal: controller.signal})

  // Abort after 10ms (before request completes)
  setTimeout(() => controller.abort(), 10)

  await assert.rejects(promise, (error) => {
    return error.name === 'AbortError' || error.message.includes('abort')
  })
})

test('does not retry aborted requests', async () => {
  server.use(
    http.get('https://registry.npmjs.org/test-abort-no-retry', () => {
      return HttpResponse.json({'dist-tags': {latest: '1.0.0'}})
    }),
  )

  const controller = new AbortController()
  controller.abort()

  const startTime = Date.now()

  await assert.rejects(
    getLatestVersion('test-abort-no-retry', {signal: controller.signal}),
    (error) => error.name === 'AbortError',
  )

  const duration = Date.now() - startTime

  assert.ok(duration < 100, `Expected fast failure but took ${duration}ms`)
})

test('RequestError has correct structure', async () => {
  server.use(
    http.get('https://registry.npmjs.org/test-error-structure', () => {
      return new HttpResponse(null, {status: 500, statusText: 'Internal Server Error'})
    }),
  )

  await assert.rejects(getLatestVersion('test-error-structure'), (error) => {
    assert.strictEqual(error.name, 'RequestError')

    assert.ok(error.response)
    assert.strictEqual(error.response.statusCode, 500)
    assert.strictEqual(error.response.statusMessage, 'Internal Server Error')
    assert.ok(error.response.headers)
    assert.strictEqual(typeof error.response.headers, 'object')

    return true
  })
})

test('RequestError includes response body on JSON errors', async () => {
  server.use(
    http.get('https://registry.npmjs.org/test-error-body', () => {
      return HttpResponse.json(
        {error: 'Internal server error'},
        {status: 500, statusText: 'Internal Server Error'},
      )
    }),
  )

  await assert.rejects(getLatestVersion('test-error-body'), (error) => {
    assert.strictEqual(error.name, 'RequestError')
    assert.deepStrictEqual(error.response.body, {error: 'Internal server error'})
    return true
  })
})

test('RequestError includes text body for non-JSON errors', async () => {
  server.use(
    http.get('https://registry.npmjs.org/test-non-json-error', () => {
      return new HttpResponse('Plain text error', {
        headers: {'content-type': 'text/plain'},
        status: 200,
        statusText: 'OK',
      })
    }),
  )

  await assert.rejects(getLatestVersion('test-non-json-error'), (error) => {
    assert.strictEqual(error.name, 'RequestError')
    assert.strictEqual(error.response.body, 'Plain text error')
    assert.strictEqual(error.response.statusCode, 200)
    assert.match(error.message, /Expected JSON content-type/)
    return true
  })
})

test('network errors do not have response property', async () => {
  server.use(
    http.get('https://registry.npmjs.org/test-network-error', () => {
      return HttpResponse.error()
    }),
  )

  await assert.rejects(getLatestVersion('test-network-error'), (error) => {
    assert.notStrictEqual(error.name, 'RequestError')
    assert.strictEqual(error.response, undefined)
    return true
  })
})
