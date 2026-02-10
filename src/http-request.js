import debug from 'debug'

const log = debug('get-latest-version')

const isJson = (contentType) => /(application\/json|\+json)/.test(contentType || '')

const maxRetries = 3
const retryDelay = 1000 // 1 second base delay

class RequestError extends Error {
  constructor(message, response, headers, body) {
    super(message)

    this.name = 'RequestError'

    this.response = {
      body,
      headers,
      statusCode: response.status,
      statusMessage: response.statusText,
    }
  }
}

export async function httpRequest({headers = {}, signal, url}) {
  log('Request: %s', url)

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    log('Attempt %d of %d', attempt + 1, maxRetries + 1)

    try {
      const response = await fetch(url, {headers, method: 'GET', signal})

      const responseHeaders = Object.fromEntries(response.headers.entries())
      const contentType = responseHeaders['content-type'] || ''

      const text = await response.text()

      let body = null
      let jsonParseError = null
      try {
        body = JSON.parse(text)
      } catch (error) {
        jsonParseError = error
      }

      if (response.status < 300 && !isJson(contentType)) {
        throw new RequestError(
          `Expected JSON content-type, got: ${contentType}`,
          response,
          responseHeaders,
          text,
        )
      }

      if (response.status < 300 && jsonParseError) {
        throw new RequestError('Invalid JSON response', response, responseHeaders, text)
      }

      if (response.status >= 400) {
        throw new RequestError(
          `HTTP ${response.status}: ${response.statusText}`,
          response,
          responseHeaders,
          body,
        )
      }

      log('Response: %d %s', response.status, response.statusText)
      return {
        body,
        headers: responseHeaders,
        method: 'GET',
        statusCode: response.status,
        statusMessage: response.statusText,
        url,
      }
    } catch (error) {
      const shouldRetry = isRetryableError(error, attempt)
      log('Error: %s (retry: %s)', error.message, shouldRetry)

      if (!shouldRetry || attempt === maxRetries) {
        throw error
      }

      const delayMs = retryDelay * 2 ** attempt
      log('Retrying in %dms...', delayMs)
      await delay(delayMs)
    }
  }
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableError(error, attempt) {
  if (attempt >= maxRetries) {
    return false
  }

  if (error.name === 'AbortError') {
    return false
  }

  if (!error.response) {
    return true
  }

  const {headers, statusCode} = error.response

  if (statusCode >= 500) {
    return true
  }

  if (statusCode < 300 && !isJson(headers['content-type'])) {
    return true
  }

  return false
}
