const mysql = require('mysql2/promise')
const { trace, SpanKind, SpanStatusCode } = require('@opentelemetry/api')
const { ATTR_DB_OPERATION_NAME, ATTR_DB_QUERY_TEXT, ATTR_DB_COLLECTION_NAME  } = require('@opentelemetry/semantic-conventions')

const { injectDatabaseFault } = require('./utils')

const metadata = require('../package.json')
const serviceName = metadata.name
const serviceVersion = metadata.version

const SQL_LIST_BOOKS = 'select isbn13, title from books where average_rating > ? order by title asc limit ?'
const SQL_GET_BOOK_BY_ISBN13 = 'select * from books where isbn13 = ?'
const SQL_SEARCH_BY_TITLE = 'select isbn13, title from books where title like ? limit ?'
const SQL_HEALTH = 'select 1'

function BooksDB(url, logger) {
  this.url = url
  this.conn = null
  this.logger = logger
  this.tracer = trace.getTracer(serviceName, serviceVersion)
}

BooksDB.prototype.start = function() {
  this.logger.info('Creating database connection pool')
  return mysql.createConnection(this.url)
    .then(c => this.conn = c)
}

BooksDB.prototype.listBooks = async function(limit = 20, rating = 0) {

  return this.tracer.startActiveSpan('dbListBooks', { kind: SpanKind.CLIENT }, async (span) => { 

    span.setAttributes({
      [ ATTR_DB_OPERATION_NAME ]: 'select',
      [ ATTR_DB_COLLECTION_NAME ]: 'books',
      [ ATTR_DB_QUERY_TEXT ]: `limit=${limit},rating=${rating}`
    })

    this.logger.info(`listBooks: limit=${limit}, rating=${rating}`
          , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })

    let error = null
    if (!!(error = injectDatabaseFault())) {
      this.logger.error(`Database error injection triggered in listBooks: ${error.message}`
          , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })
      span.recordException(error)
      span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'listBooks'
      })
      span.end()
      throw error
    }

    try {
      const result = await this.conn.query(SQL_LIST_BOOKS, [ rating, limit ])
      this.logger.info(`listBooks: count=${result[0].length}`
          , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })
      span.setStatus({ code: SpanStatusCode.OK })
      return result[0]
    } catch(error) {
      this.logger.error('listBooks:' , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })
      span.recordException(error)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'SQL_LIST_BOOKS query failed'
      })
      throw error
    } finally { span.end() }
  })

}

BooksDB.prototype.getBookByISBN13 = async function(isbn13) {

  return this.tracer.startActiveSpan('dbGetBookByISBN13', { kind: SpanKind.CLIENT }, async (span) => { 

    span.setAttributes({
      [ ATTR_DB_OPERATION_NAME ]: 'select',
      [ ATTR_DB_COLLECTION_NAME ]: 'books',
      [ ATTR_DB_QUERY_TEXT ]: `isbn13=${isbn13}`
    })

    this.logger.info(`getBookByISBN13: isbn13=${isbn13}` , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })

    let error = null
    if (!!(error = injectDatabaseFault())) {
      this.logger.error(`Database error injection triggered in getBookByISBN13: ${error.message}`
          , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })
      span.recordException(error)
      span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'searchBooksByTitle'
      })
      span.end()
      throw error
    }

    try {
      const result = await this.conn.query(SQL_GET_BOOK_BY_ISBN13, [ isbn13 ])
      this.logger.info(`getBookByISBN13: ${isbn13}=${!!result[0].length}`
          , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })
      span.setStatus({ code: SpanStatusCode.OK })

      if (!result[0].length)
        return null
      return result[0][0]
    } catch (error) {
      this.logger.error('getBookByISBN13:', { [ ATTR_DB_COLLECTION_NAME ]: 'books' })
      span.recordException(error)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'SQL_GET_BOOK_BY_ISBN13 query failed'
      })
      throw error
    } finally { span.end() }
  })
}

BooksDB.prototype.searchBooksByTitle = async function(text, limit = 20) {

  return this.tracer.startActiveSpan('dbSearchBooksByTitle', { kind: SpanKind.CLIENT }, async(span) => {

    span.setAttributes({
      [ ATTR_DB_OPERATION_NAME ]: 'select',
      [ ATTR_DB_COLLECTION_NAME ]: 'books',
      [ ATTR_DB_QUERY_TEXT ]: text
    })

    this.logger.info(`searchBooksByTitle: search_term=${text}, limit=${limit}`
          , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })

    let error = null
    if (!!(error = injectDatabaseFault())) {
      this.logger.error(`Database error injection triggered in searchBooksByTitle: ${error.message}`
          , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })
      span.recordException(error)
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'searchBooksByTitle'
      })

      span.end()
      throw error
    }

    try {
      const pattern = `%${text}%`
      const result = await this.conn.query(SQL_SEARCH_BY_TITLE, [ pattern, limit ])
      this.logger.info(`searchBooksByTitle: ${text}=${result[0].length}`
          , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })
      span.setStatus({
        code: SpanStatusCode.OK
      })
      return result[0]
    } catch(error) {
      this.logger.error('searchBooksByTitle:' , { [ ATTR_DB_COLLECTION_NAME ]: 'books' })
      span.recordException(error)
      span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `SQL_SEARCH_BY_TITLE query failed`
      })

      throw error
    } finally {
      span.end()
    }
  })
}

BooksDB.prototype.health = function() {
  return this.conn.query(SQL_HEALTH)
    .then(() => true)
}

BooksDB.prototype.close = function() {
  this.logger.info('Closing database connection pool')
  this.conn.close()
}

module.exports = BooksDB
