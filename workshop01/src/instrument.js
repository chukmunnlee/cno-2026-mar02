// Imports
const {NodeSDK} = require('@opentelemetry/sdk-node')
const {getNodeAutoInstrumentations} = require('@opentelemetry/auto-instrumentations-node')
const {resourceFromAttributes} = require('@opentelemetry/resources')
const {ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions')

// Trace
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc')
const {SimpleSpanProcessor, ConsoleSpanExporter, BatchSpanProcessor} = require('@opentelemetry/sdk-trace-node')

const metadata = require('../package.json')
const serviceName = metadata.name
const serviceVersion = metadata.version

const OTEL_COLLECTOR_HOST = process.env.OTEL_COLLECTOR_HOST || '127.0.0.1'
const OTEL_COLLECTOR_PORT = process.env.OTEL_COLLECTOR_PORT || 4317

// Trace exporters
// TODO: Task 2
// TODO: Create OTLP trace exporter
const otlpExporter = new OTLPTraceExporter(
  { url: `http://${OTEL_COLLECTOR_HOST}:${OTEL_COLLECTOR_PORT}` })
// Can configure batching details
const otlpProcessor = new BatchSpanProcessor(otlpExporter)

// TODO: Task 2
// TODO: Create console exporter, for debugging
const consoleExporter = new ConsoleSpanExporter()
const consoleProcessor = new SimpleSpanProcessor(consoleExporter)

// TODO: Task 2
// TODO: Configure OpenTelemetry
const sdk = new NodeSDK({
  // configure resource attributes
  resource: resourceFromAttributes({
    [ ATTR_SERVICE_NAME ]: metadata.name,
    [ ATTR_SERVICE_VERSION ]: metadata.version,
    'developer.name': 'chuk'
  }),

  // Add trace to the instrumentation
  spanProcessors: [ otlpProcessor, consoleProcessor ],
  //spanProcessors: [ otlpProcessor ],

  // configure the application
  instrumentations: getNodeAutoInstrumentations()
})

process.on('SIGTERM', async () => {
  // TODO: Task 2
  // TODO: Shutdown instrumentation
  await sdk.shutdown()
  console.info('Instrumentation terminated')
})

// TODO: Task 2
// TODO: start instrumentation
sdk.start()

console.info('Starting instrumentation')
