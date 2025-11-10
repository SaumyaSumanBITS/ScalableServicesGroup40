// order-service/src/server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const orderCtl = require('./controllers/orderController');
const ticketCtl = require('./controllers/ticketController');
const orderRepo = require('./repositories/orderRepo');
const ticketRepo = require('./repositories/ticketRepo');
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

app.post('/v1/orders', idempotentRoute((req,res)=>{ req.repositories={orders:orderRepo, tickets:ticketRepo}; return orderCtl.createOrder(req,res); }));
app.get('/v1/orders/:id',       (req,res)=>{ req.repositories={orders:orderRepo}; return orderCtl.getOrderById(req,res); });
app.post('/v1/orders/:id/cancel',(req,res)=>{ req.repositories={orders:orderRepo}; return orderCtl.cancelOrder(req,res); });

app.get('/v1/orders/:id/tickets',(req,res)=>{ req.repositories={tickets:ticketRepo}; return ticketCtl.getTicketsByOrderId(req,res); });

const PORT = process.env.ORDER_PORT || 3004;
app.listen(PORT, () => console.log('order-service listening on', PORT));
