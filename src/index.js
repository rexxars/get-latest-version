const url = require('url')
const getIt = require('get-it')
const {debug, retry, promise, httpErrors, jsonResponse} = require('get-it/middleware')
const registryUrl = require('registry-url')
const registryAuthToken = require('registry-auth-token')
const semver = require('semver')

const isJson = (contentType) => /(application\/json|\+json)/.test(contentType || '')

const shouldRetry = (err, num, options) => {
  const response = err.response || {statusCode: 500, headers: {}}

  // allow retries on low-level errors (socket errors et al)
  return (
    retry.shouldRetry(err, num, options) ||
    // npm registry routinely fails, giving 503 and similar
    (response && response.statusCode >= 500) ||
    // npm registry sometimes returns 2xx with HTML content
    (response.statusCode < 300 && !isJson(response.headers['content-type']))
  )
}

const httpRequest = getIt([
  jsonResponse({force: true}),
  httpErrors(),
  debug({namespace: 'get-latest-version'}),
  promise(),
  retry({shouldRetry}),
])

const getLatestVersion = (pkgName, opts) => {
  const scope = pkgName.split('/')[0]
  const regUrl = registryUrl(scope)
  const pkgUrl = url.resolve(regUrl, encodeURIComponent(pkgName).replace(/^%40/, '@'))
  const options =
    typeof opts === 'string'
      ? {range: opts, auth: true}
      : Object.assign({range: 'latest', auth: true}, opts)

  const authInfo = options.auth && registryAuthToken(regUrl, {recursive: true})
  const request = options.request || httpRequest

  const headers = {
    accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
  }

  if (authInfo) {
    headers.authorization = `${authInfo.type} ${authInfo.token}`
  }

  return request({url: pkgUrl, headers})
    .then((res) => {
      const data = res.body
      const range = options.range

      if (data['dist-tags'][range]) {
        return data['dist-tags'][range]
      }

      if (data.versions[range]) {
        return range
      }

      const versions = Object.keys(data.versions)
      const version = semver.maxSatisfying(versions, range)

      if (!version) {
        throw new Error(`No version exists that satisfies "${range}"`)
      }

      return version
    })
    .catch((err) => {
      if (err.response && err.response.statusCode === 404) {
        throw new Error(`Package \`${pkgName}\` doesn't exist`)
      }

      throw err
    })
}

getLatestVersion.request = httpRequest

module.exports = getLatestVersion
