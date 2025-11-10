// === Add near top of server.js (after app = express()) ===
const { correlationMiddleware } = require('./logger');
app.use(correlationMiddleware);

const { register } = require('./metrics');
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// === Example of propagating correlation ID to downstream services ===
// await axios.post(url, body, { headers: { 'X-Correlation-Id': req.correlationId } });
