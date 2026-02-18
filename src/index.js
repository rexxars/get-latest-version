import {getIt} from 'get-it'
import {debug, httpErrors, jsonResponse, promise, retry} from 'get-it/middleware'
import registryAuthToken from 'registry-auth-token'
import registryUrl from 'registry-url'
import semver from 'semver'

const isJson = (contentType) => /(application\/json|\+json)/.test(contentType || '')

function resolveRegistryUrl(pkgName, options) {
  if (options.registryUrl) {
    return options.registryUrl
  }
  const scope = pkgName.split('/')[0]
  return registryUrl(scope)
}

function shouldRetry(err, num, options) {
  const response = err.response || {headers: {}, statusCode: 500}

  return (
    // allow retries on low-level errors (socket errors et al)
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

async function getLatestVersion(pkgName, opts) {
  const options =
    typeof opts === 'string'
      ? {auth: true, range: opts}
      : Object.assign({auth: true, range: 'latest'}, opts)

  const regUrl = resolveRegistryUrl(pkgName, options)
  const pkgUrl = new URL(encodeURIComponent(pkgName).replace(/^%40/, '@'), regUrl).href
  const authInfo = options.auth && registryAuthToken(regUrl, {recursive: true})
  const request = options.request || httpRequest

  const headers = {
    accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*',
  }

  if (authInfo) {
    headers.authorization = `${authInfo.type} ${authInfo.token}`
  }

  let res
  try {
    res = await request({headers, url: pkgUrl})
  } catch (error) {
    if (error.response && error.response.statusCode === 404) {
      throw new Error(`Package \`${pkgName}\` doesn't exist`)
    }

    throw error
  }

  const data = res.body
  const range = options.range
  const latest = data['dist-tags'].latest

  if (data['dist-tags'][range]) {
    return options.includeLatest
      ? {inRange: data['dist-tags'][range], latest}
      : data['dist-tags'][range]
  }

  if (data.versions[range]) {
    return options.includeLatest ? {inRange: range, latest} : range
  }

  const versions = Object.keys(data.versions)
  const version = semver.maxSatisfying(versions, range)

  if (version) {
    return options.includeLatest ? {inRange: version, latest} : version
  }

  return options.includeLatest ? {inRange: undefined, latest} : undefined
}

getLatestVersion.request = httpRequest

export {getLatestVersion}
