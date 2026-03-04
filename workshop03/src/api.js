const {trace, SpanKind, SpanStatusCode} = require('@opentelemetry/api')
const {ATTR_HTTP_REQUEST_METHOD, ATTR_URL_PATH, ATTR_HTTP_RESPONSE_STATUS_CODE} = require('@opentelemetry/semantic-conventions')

const express = require('express')
const { randomDelay, injectFault, getInflights, updateInflight } = require ('./utils')

const { httpRequestTotal, httpRequestInflightTotal, httpRequestDurationMs } = require('./metrics')

const BOOK_PATTERN = /^\/book\/.+$/

const metadata = require('../package.json')
const serviceName = metadata.name
const serviceVersion = metadata.version

// callback function is passed a parameter, gauge
const observeInFlight = function(gauge) {
  // Business logic for calulating infligh request
  const reqs = getInflights()
  const urls = Object.keys(reqs)
  for (let i = 0; i < urls.length; i++) {
    const parts = urls[i].split('@')
    const attributes = {
      [ ATTR_HTTP_REQUEST_METHOD ]: parts[0],
      [ ATTR_URL_PATH ]: parts.slice(1).join('@')
    }
    
    //TODO: Task 4 - record inflight request with cb
    console.info(`>>> observeInFlight ${urls[i]} = ${reqs[urls[i]]}`)
    gauge.observe(reqs[urls[i]], attributes)
  }
}

// TODO: Task 4 - httpRequestInflightTotal - use the observeInFlight as callback
httpRequestInflightTotal.addCallback(observeInFlight)


function BooksAPI(booksDB, logger) {

  this.booksDB = booksDB
  this.logger = logger
  this.router = express.Router()
  
  this.tracer = trace.getTracer(serviceName, serviceVersion)

  // Instrument application when the application receives a request
  this.router.use((req, resp, next) => {

    // IMPORTANT: Reduce the cardinality
    let path = BOOK_PATTERN.test(req.path)? '/book/:isbn13': req.path

    req.startTime = Date.now()

    // Increment the number of inflight request
    updateInflight(req.method, path, 1)

    // When the request completes, Node will call this function
    // We record our metrics in here
    resp.on('close', () => {
      
      //TODO: Task 4 Create attributes for metrics
      // Create attributes
      const attributes = {
        [ ATTR_HTTP_REQUEST_METHOD ]: req.method,
        [ ATTR_URL_PATH ]: path,
        [ ATTR_HTTP_RESPONSE_STATUS_CODE ]: resp.statusCode
      }
      
      //TODO: Task 4 - httpRequestTotal - Count the number of request
      httpRequestTotal.add(1, { ...attributes })

      const latency = Date.now() - req.startTime
      //TODO: Task 4 - httpRequestDurationMs - Record request duration
      httpRequestDurationMs.record(latency, { ...attributes })
      

      // Decrement the number of inflight request
      updateInflight(req.method, path, -1)
    })

    next()
  })

  this.router.get('/search', async (req, resp) => {

    const text = req.query.q
    const count = parseInt(req.query.count) || 20

    // Simulate delay
    setTimeout(async () => {

      this.tracer.startActiveSpan('search', { kind: SpanKind.SERVER }, async (span) => {

        span.setAttributes({
          [ ATTR_HTTP_REQUEST_METHOD ]: req.method,
          [ ATTR_URL_PATH ]: req.path
        })

        // Inject syntactic fault fault
        let error = injectFault(req, this.logger)
        if (!!error) {
          this.logger.error(req.originalUrl, error)
          span.recordException(error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          })
          
          span.end()
          resp.status(error.status).json({ message: error.message, injected: true })
          return 
        }

        if (!text) {
          let message = 'No search terms'
          this.logger.error(req.originalUrl, message)
          span.recordException(message)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message
          })

          span.end()

          return resp.status(400).json({ message })
        }

        try {
          const result = await this.booksDB.searchBooksByTitle(text, count)
          span.setStatus({ code: SpanStatusCode.OK })
          resp.status(200).json({ timestamp: Date.now(), result }) 
        } catch (error) {
          this.logger.error(req.originalUrl, error)
            span.recordException(error)
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: 'searchBooksByTitle'
            })
          resp.status(500).json(error)
        } finally {
          span.end()
        }

      })
    }, randomDelay(1, 5))
  })

  this.router.get('/books', async (req, resp) => {
    const count = parseInt(req.query.count) || 20
    const rating = parseInt(req.query.rating) || 0

    // Simulate delay
    setTimeout(async () => {
      this.tracer.startActiveSpan('listBooks', { kind: SpanKind.SERVER }, async (span) => {

        span.setAttributes({
          [ ATTR_HTTP_REQUEST_METHOD ]: req.method,
          [ ATTR_URL_PATH ]: req.path
        })

        let error = injectFault(req, this.logger)
        if (!!error) {
          this.logger.error(req.originalUrl, error)
          span.recordException(error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          })
          
          span.end()
          resp.status(error.status).json({ message: error.message, injected: true })
          return 
        }

        try {
          const result = await this.booksDB.listBooks(count, rating)
          span.setStatus({ code: SpanStatusCode.OK })
          resp.status(200).json({ timestamp: Date.now(), result }) 

        } catch (error) {
          this.logger.error(req.originalUrl, error)
          span.recordException(error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          })
          resp.status(500).json(error)
        } finally {
          span.end()
        }
      })
    }, randomDelay(1, 5))
  })

  this.router.get('/book/:isbn13', async (req, resp) => {
    const isbn13 = req.params.isbn13

    // Simulate delay
    setTimeout(async () => {
      this.tracer.startActiveSpan('getBookByISBN13', { kind: SpanKind.SERVER }, async (span) => {

        span.setAttributes({
          [ ATTR_HTTP_REQUEST_METHOD ]: req.method,
          [ ATTR_URL_PATH ]: req.path
        })

        let error = injectFault(req, this.logger)
        if (!!error) {
          this.logger.error(req.originalUrl, error)
          span.recordException(error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          })
          
          span.end()
          resp.status(error.status).json({ message: error.message, injected: true })
          return 
        }

        try {
          const result = await this.booksDB.getBookByISBN13(isbn13)
          if (!result) {
            span.setStatus({ 
              code: SpanStatusCode.OK,
              message: `ISBN13 ${isbn13} not found`
            })
            return resp.status(404).json({ message: `ISBN13 ${isbn13} not found` })
          }

          span.setStatus({ code: SpanStatusCode.OK })

          resp.status(200)
            .json({ timestamp: Date.now(), ...result }) 

        } catch (error) {
          this.logger.error(req.originalUrl, error)
          span.recordException(error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          })
          resp.status(500).json(error)
        } finally {
          span.end()
        }
      })
    }, randomDelay(1, 5))
  })
}

module.exports = BooksAPI
