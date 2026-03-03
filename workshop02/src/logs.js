const {ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION} = require('@opentelemetry/semantic-conventions')
const { logs } = require('@opentelemetry/api-logs')

const winston = require('winston')
const { combine, errors, json, timestamp } = winston.format

const OTLPTransport = require('./otlp-transport')

const metadata = require('../package.json')
const serviceName = metadata.name
const serviceVersion = metadata.version

// TODO: Task 2
// TODO: Create a OTLP log transport


// TODO: create a OTLP transport for the logger


const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  // TODO: add attributes to logger
  defaultMeta: {
    [ ATTR_SERVICE_NAME ]: serviceName,
    [ ATTR_SERVICE_VERSION ]: serviceVersion
  },
  transports: [
    // TODO: Task 2
    // TODO: Add logger over OTLP

    
    new winston.transports.Console({ handleExceptions: true, handleRejections: true })
  ]
})

const w3cLogFormat = function(req, resp, logger) {

  const startTime = Date.now()

  resp.on('close', () => {
    const logline = [
      new Date().toISOString().replace('T', ' ').replace('Z', ''), // date time
      req.ip || req.connection.remoteAddress || '-',               // c-ip
      req.get('User-Agent') || '-',                               // cs(User-Agent)
      req.get('Referer') || '-',                                  // cs(Referer)
      req.method,                                                 // cs-method
      req.originalUrl || req.url,                                 // cs-uri-stem
      req.query ? new URLSearchParams(req.query).toString() : '-', // cs-uri-query
      resp.statusCode,                                             // sc-status
      resp.get('Content-Length') || '-',                          // sc-bytes
      Date.now() - startTime
    ].join(' ')
    logger.info(logline)
  })
}

module.exports = { logger, w3cLogFormat }
