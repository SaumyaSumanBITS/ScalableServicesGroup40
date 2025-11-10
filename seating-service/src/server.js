// seating-service/src/server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const ctl = require('./controllers/seatingController');
const repo = require('./repositories/seatsRepo');

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

app.get('/v1/seats',           (req,res)=>{ req.repositories={seats:repo}; return ctl.listSeatsByEvent(req,res); });
app.post('/v1/seats/reserve',  (req,res)=>{ req.repositories={seats:repo}; return ctl.reserveSeats(req,res); });
app.post('/v1/seats/release',  (req,res)=>{ req.repositories={seats:repo}; return ctl.releaseHold(req,res); });
app.post('/v1/seats/allocate', (req,res)=>{ req.repositories={seats:repo}; return ctl.allocateHold(req,res); });

const PORT = process.env.SEATING_PORT || 3003;
app.listen(PORT, () => console.log('seating-service listening on', PORT));
