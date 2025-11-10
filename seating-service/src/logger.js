const { v4: uuidv4 } = require('uuid');

// Express middleware to add/propagate a correlation ID and emit structured JSON logs
function correlationMiddleware(req, res, next) {
  const incomingId = req.headers['x-correlation-id'];
  const correlationId = incomingId || uuidv4();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);

  const start = Date.now();

  res.on('finish', () => {
    const record = {
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME || 'unknown-service',
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      correlationId
    };
    // one line JSON, great for 'kubectl logs'
    console.log(JSON.stringify(record));
  });

  next();
}

module.exports = { correlationMiddleware };
