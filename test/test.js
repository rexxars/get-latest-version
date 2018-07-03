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

test('rejects if range cannot be satisfied', () =>
  getLatestVersion('react-markdown', '^1888.0.0')
    .then(shouldNotResolve)
    .catch(err => expect(err.message).toMatch(/that satisfies/i)))

test('rejects with package not found error', () =>
  getLatestVersion('##invalid##')
    .then(shouldNotResolve)
    .catch(err => expect(err.message).toMatch(/doesn't exist/i)))

test('retries on 500-errors', () => {
  let tries = 0
  const inject = (evt, prev) => (++tries === 1 ? {statusCode: 500} : null)
  const request = getLatestVersion.request.clone().use(injectResponse({inject}))
  return expect(getLatestVersion('npm', {request})).resolves.toMatch(versionPattern)
})
