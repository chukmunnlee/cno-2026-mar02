const { trace, SpanStatusCode } = require('@opentelemetry/api')
const {ATTR_HTTP_REQUEST_METHOD, ATTR_URL_PATH, ATTR_HTTP_RESPONSE_STATUS_CODE} = require('@opentelemetry/semantic-conventions')

const express = require('express')

const BooksDB = require('./books')
const BooksAPI = require('./api')

const { logger } = require('./logs')

const PORT = parseInt(process.env.PORT) || 5000
const BOOKS_URL = process.env.BOOKS_URL || 'mysql://root:changeit@127.0.0.1:3306/acme_books'

const db = new BooksDB(BOOKS_URL, logger)
const booksAPI = new BooksAPI(db, logger)

const app = express()

app.use('/api', booksAPI.router)

app.get('/health', (_, resp) => {
  db.health()
    .then(() => resp.status(200).json({ timestamp: Date.now(), message: 'OK' })) 
    .catch(error => resp.status(500).json({ timestamp: Date.now(), message: error }))
})

app.use((error, req, resp, _next) => {

  logger.info('application error', JSON.stringify(error))
  resp.status(500).json({ timestamp: Date.now(), message: error })
})

// Handle invalid requests
app.use((_error, req, resp, _next) => {

  const statusCode = 404
  const message = `Invalid resource: ${req.path}`

  const span = trace.getActiveSpan()

  if (!!span) {
    
    span.setAttributes({
      [ ATTR_HTTP_REQUEST_METHOD ]: req.method,
      [ ATTR_URL_PATH ]: req.path,
      [ ATTR_HTTP_RESPONSE_STATUS_CODE ]: statusCode
    })

    span.setStatus({
      code: SpanStatusCode.ERROR,
      message
    })
  }

  logger.error(message)
  resp.status(statusCode).json({ message })

})

db.start()
  .then(() => {
    app.listen(PORT, () => {
      console.info(`Application started on port ${PORT} at ${new Date()}`)
    })
  })
  .catch(err => {
    console.error('DB connection error')
    console.error(err)
  })
