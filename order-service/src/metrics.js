const client = require('prom-client');
const register = new client.Registry();

client.collectDefaultMetrics({ register });

// orders_total{status="success|failed"}
const ordersTotal = new client.Counter({
  name: 'orders_total',
  help: 'Total number of orders created',
  labelNames: ['status'],
});
register.registerMetric(ordersTotal);

module.exports = { register, ordersTotal };
