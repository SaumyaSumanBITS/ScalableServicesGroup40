const client = require('prom-client');
const register = new client.Registry();

client.collectDefaultMetrics({ register });

// seat_reservations_failed{reason="unavailable|db_error|other"}
const seatReservationsFailed = new client.Counter({
  name: 'seat_reservations_failed',
  help: 'Total number of failed seat reservation attempts',
  labelNames: ['reason'],
});
register.registerMetric(seatReservationsFailed);

module.exports = { register, seatReservationsFailed };
