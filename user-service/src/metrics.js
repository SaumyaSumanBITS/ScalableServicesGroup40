const client = require('prom-client');
const register = new client.Registry();

// Collect default Node.js process metrics (CPU, heap, event loop, GC, etc.)
client.collectDefaultMetrics({ register });

module.exports = { register };
