// payment-service/src/server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const ctl = require('./controllers/paymentController');
const repo = require('./repositories/paymentRepo');
const { idempotentRoute } = require('./middleware/idempotency');

const app = express();
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



app.use(express.json());

app.post('/v1/payments/charge', idempotentRoute((req,res)=>{ req.repositories={payments:repo}; return ctl.charge(req,res); }));
app.post('/v1/payments/refund', (req,res)=>{ req.repositories={payments:repo}; return ctl.refund(req,res); });

const PORT = process.env.PAYMENT_PORT || 3005;
app.listen(PORT, () => console.log('payment-service listening on', PORT));
