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
  
  this.tracer = trace.getTracer(serviceName, serviceVersion)

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
