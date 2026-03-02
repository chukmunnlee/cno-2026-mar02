const {trace, SpanKind, SpanStatusCode} = require('@opentelemetry/api')
const {ATTR_HTTP_REQUEST_METHOD, ATTR_URL_PATH} = require('@opentelemetry/semantic-conventions')

const express = require('express')
const { randomDelay, injectFault } = require ('./utils')

const metadata = require('../package.json')
const serviceName = metadata.name
const serviceVersion = metadata.version

function BooksAPI(booksDB, logger) {

  this.booksDB = booksDB
  this.logger = logger
  this.router = express.Router()
  
  // TODO: Task 5
  // TODO: get tracer
  this.tracer = trace.getTracer(serviceName, serviceVersion)

  this.router.get('/search', async (req, resp) => {

    const text = req.query.q
    const count = parseInt(req.query.count) || 20

    // Simulate delay
    setTimeout(async () => {

      // TODO: Task 5
      // TODO: start active span as server 
      this.tracer.startActiveSpan('search', { kind: SpanKind.SERVER }, async (span) => {

        // TODO: Task 5
        // TODO: set span attributes
        span.setAttribute({
          [ ATTR_URL_PATH ]: '/search',
          [ ATTR_HTTP_REQUEST_METHOD ]: req.method,
          'http.full_request': req.path
        })

        // Inject syntactic fault fault
        let error = injectFault(req, this.logger)
        if (!!error) {
          this.logger.error(req.originalUrl, error)
          // TODO: Task 5
          // TODO: record error and set error status
          span.recordException(error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message
          })

          // TODO: Task 5
          // TODO: close the span
          span.end()

          resp.status(error.status).json({ message: error.message, injected: true })
          return 
        }

        if (!text) {
          let message = 'No search terms'
          this.logger.error(req.originalUrl, message)
          // TODO: Task 5
          // TODO: record error and set error status
            span.recordException(error)
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message
            })

          // TODO: Task 5
          // TODO: close the span
          span.end()
          
          return resp.status(400).json({ message })
        }

        try {
          const result = await this.booksDB.searchBooksByTitle(text, count)
          span.setStatus({
            code: SpanStatusCode.OK
          })
          resp.status(200).json({ timestamp: Date.now(), result }) 
        } catch (error) {
          this.logger.error(req.originalUrl, error)
          // TODO: Task 5
          // TODO: record error and set error status


          resp.status(500).json(error)
        } finally {
          // TODO: Task 5
          // TODO: close the span
          span.end()
        }

      // TODO: Task 5 
      // TODO: end active span as server 
      })

    }, randomDelay(1, 5))
  })

  this.router.get('/books', async (req, resp) => {
    const count = parseInt(req.query.count) || 20
    const rating = parseInt(req.query.rating) || 0

    // Simulate delay
    setTimeout(async () => {

      // Inject syntactic fault fault
      // TODO: change
      //let error = injectFault(req, resp, this.logger)
      let error = injectFault(req, this.logger)
      if (!!error) {
        this.logger.error(req.originalUrl, error)
        resp.status(error.status).json({ message: error.message, injected: true })
        return 
      }

      try {
        const result = await this.booksDB.listBooks(count, rating)
        resp.status(200).json({ timestamp: Date.now(), result }) 

      } catch (error) {
        this.logger.error(req.originalUrl, error)
        resp.status(500).json(error)
      } finally {
      }
    }, randomDelay(1, 5))
  })

  this.router.get('/book/:isbn13', async (req, resp) => {
    const isbn13 = req.params.isbn13

    // Simulate delay
    setTimeout(async () => {
      
      // Inject syntactic fault fault
      // TODO: change
      //let error = injectFault(req, resp, this.logger)
      let error = injectFault(req, this.logger)
      if (!!error) {
        this.logger.error(req.originalUrl, error)
        resp.status(error.status).json({ message: error.message, injected: true })
        return 
      }

      try {
        const result = await this.booksDB.getBookByISBN13(isbn13)
        if (!result)
          return resp.status(404).json({ message: `ISBN13 ${isbn13} not found` })

        resp.status(200)
          .json({ timestamp: Date.now(), ...result }) 

      } catch (error) {
        this.logger.error(req.originalUrl, error)
        resp.status(500).json(error)
      } finally {
      }
    }, randomDelay(1, 5))
  })
}

module.exports = BooksAPI
