const client = require('prom-client');
const register = new client.Registry();

client.collectDefaultMetrics({ register });

// payments_failed_total{reason="insufficient_funds|db_error|other"}
const paymentsFailedTotal = new client.Counter({
  name: 'payments_failed_total',
  help: 'Total number of failed payments',
  labelNames: ['reason'],
});
register.registerMetric(paymentsFailedTotal);

module.exports = { register, paymentsFailedTotal };
