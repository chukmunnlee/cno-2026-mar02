const { metrics } = require('@opentelemetry/api')

const metadata = require('../package.json')

const HTTP_REQUEST_TOTAL = 'http_request_total'
const HTTP_REQUEST_INFLIGHT_TOTAL = 'http_request_inflight_total'
const HTTP_REQUEST_DURATION_MS = 'http_request_duration_ms'

// TODO: Task 3 - Get metrics provider
const metricProvider = metrics.getMeter(metadata.name, metadata.version)

// TODO: Task 3 - Create counter metrics for HTTP_REQUEST_TOTAL
const httpRequestTotal = metricProvider.createCounter(HTTP_REQUEST_TOTAL, {
  description: 'Total number of requests',
  unit: 'int'
})

// TODO: Task 3 - Create histogram metrics for HTTP_REQUEST_DURATION_MS
const httpRequestDurationMs = metricProvider.createHistogram(HTTP_REQUEST_DURATION_MS, {
  description: 'Request duration in milliseconds',
  unit: 'ms'
})


// TODO: Task 3 - Create gauge metrics for HTTP_REQUEST_INFLIGHT_TOTAL
const httpRequestInflightTotal = metricProvider.createObservableGauge(HTTP_REQUEST_INFLIGHT_TOTAL, {
  description: 'Total number of inflight request',
  unit: 'int'
})

// TODO: Task 3 - Export the metrics
module.exports = { 
  httpRequestTotal, httpRequestDurationMs, httpRequestInflightTotal, 
  HTTP_REQUEST_TOTAL, HTTP_REQUEST_DURATION_MS, HTTP_REQUEST_INFLIGHT_TOTAL
}
