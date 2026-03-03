// Imports
const {NodeSDK} = require('@opentelemetry/sdk-node')
const {getNodeAutoInstrumentations} = require('@opentelemetry/auto-instrumentations-node')
const {resourceFromAttributes} = require('@opentelemetry/resources')
const {ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION} = require('@opentelemetry/semantic-conventions')

// Trace
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc')
const {SimpleSpanProcessor, ConsoleSpanExporter, BatchSpanProcessor} = require('@opentelemetry/sdk-trace-node')

// Logs
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-grpc')
const { BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs')

const metadata = require('../package.json')
const serviceName = metadata.name
const serviceVersion = metadata.version

const OTEL_COLLECTOR_HOST = process.env.OTEL_COLLECTOR_HOST || '127.0.0.1'
const OTEL_COLLECTOR_PORT = process.env.OTEL_COLLECTOR_PORT || 4317

// TODO: Task 2
// TODO: Add log record processor


// Trace exporters
const otlpTraceProcessor = new BatchSpanProcessor(
    new OTLPTraceExporter({
    url: `http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT}`
  })
)

const consoleTraceProcessor = new SimpleSpanProcessor(new ConsoleSpanExporter())

const sdk = new NodeSDK({
  // Configure resource attributes
  resource: resourceFromAttributes({
    [ ATTR_SERVICE_NAME ]: serviceName,
    [ ATTR_SERVICE_VERSION ]: serviceVersion
  }),

  // Configure span processor
  spanProcessors: [ otlpTraceProcessor, /*consoleTraceProcessor */ ],

  // TODO: Task 2
  // TODO: Configure log processor 


  // Auto configure libraries for auto instrumentation
  instrumentations: getNodeAutoInstrumentations()
})

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.info('Instrumentation terminated'))
    .finally(() => process.exit(0))
})

sdk.start()

console.info('Starting instrumentation')
