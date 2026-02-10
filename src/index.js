import registryAuthToken from 'registry-auth-token'
import registryUrl from 'registry-url'
import semver from 'semver'

import {httpRequest} from './http-request.js'

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
    res = await request({headers, signal: options.signal, url: pkgUrl})
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

function resolveRegistryUrl(pkgName, options) {
  if (options.registryUrl) {
    return options.registryUrl
  }
  const scope = pkgName.split('/')[0]
  return registryUrl(scope)
}

getLatestVersion.request = httpRequest

export {getLatestVersion}
