const errorRate = parseFloat(process.env.ERROR_INJECTION_RATE) || 50
const enabledRoutes = process.env.ERROR_INJECTION_ROUTES?.split(',') || ['all']
const errorTypes = [
  { status: 500, message: 'Random server error injected' },
  { status: 503, message: 'Service temporarily unavailable' },
  { status: 429, message: 'Too many requests' },
  { status: 408, message: 'Request timeout' }
]

const databaseErrorRate = parseInt(process.env.DB_ERROR_INJECTION_RATE) || 25
const databaseErrors = [
  new Error('Error 1054: Unknown column "column_name" in "field list"'),
  new Error('Connection lost: The server closed the connection'),
  new Error('ER_LOCK_WAIT_TIMEOUT: Lock wait timeout exceeded'),
  new Error('ER_TOO_MANY_USER_CONNECTIONS: Too many connections'),
  new Error('ER_OUT_OF_RESOURCES: Out of memory'),
  new Error('ERROR 1040: Too many connections'),
  new Error('PROTOCOL_CONNECTION_LOST: Connection lost'),
  new Error('ERROR 1045: Access denied')
]

function randomDelay(min = 1, max = 10) {
  return Math.floor(Math.random() * max * 1000) + (min * 1000)
}

function sampleError(errorRate) {
  return Math.floor(Math.random() * 100) + 1 < errorRate
}

function injectFault(req, logger) {
  if (sampleError(errorRate) && (enabledRoutes.includes('all') || enabledRoutes.some(route => req.path.includes(route)))) {
      const error = errorTypes[Math.floor(Math.random() * errorTypes.length)]
      logger.error(`Error injection triggered for ${req.path}: ${error.message}`)
      //resp.status(error.status).json({ message: error.message, injected: true })
      return error
    }
  return false
}

function injectDatabaseFault() {
  if (sampleError(databaseErrorRate))
    return databaseErrors[Math.floor(Math.random() * databaseErrors.length)]
  return null
}

module.exports = { randomDelay, injectFault, injectDatabaseFault }
