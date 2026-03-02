const winston = require('winston')
const { combine, errors, json, timestamp } = winston.format

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json()
  ),
  transports: [
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

module.exports = { logger }
