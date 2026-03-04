const Transport = require('winston-transport')
const { SeverityNumber } = require('@opentelemetry/api-logs')

// Custom Winston Transport for OpenTelemetry
class OTLPTransport extends Transport {
  constructor(opts) {
    super(opts);
    if (!opts.otlpLogger)
      throw 'otlpLogger not set'
    this.otlpLogger = opts.otlpLogger;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const { level, message, ...attributes } = info;

    this.otlpLogger.emit({
      severityText: level.toUpperCase(),
      severityNumber: this.getSeverityNumber(level),
      //body: typeof message === 'object' ? JSON.stringify(message) : message,
      body: message,
      attributes: attributes,
    });

    callback();
  }

  getSeverityNumber(level) {
    const levels = {
      'error': SeverityNumber.ERROR,
      'warn': SeverityNumber.WARN,
      'info': SeverityNumber.INFO,
      'http': SeverityNumber.INFO,
      'verbose': SeverityNumber.DEBUG,
      'debug': SeverityNumber.DEBUG,
      'silly': SeverityNumber.TRACE,
    };
    return levels[level] || SeverityNumber.INFO;
  }
}

module.exports = OTLPTransport 
