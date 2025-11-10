// catalog-service/src/server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const eventCtl = require('./controllers/eventController');
const venueCtl = require('./controllers/venueController');
const eventRepo = require('./repositories/eventRepo');
const venueRepo = require('./repositories/venueRepo');

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

app.get('/v1/events',     (req,res)=>{ req.repositories={events:eventRepo}; return eventCtl.searchEvents(req,res); });
app.get('/v1/events/:id', (req,res)=>{ req.repositories={events:eventRepo}; return eventCtl.getEventById(req,res); });
app.post('/v1/events',    (req,res)=>{ req.repositories={events:eventRepo}; return eventCtl.createEvent(req,res); });

app.get('/v1/venues',     (req,res)=>{ req.repositories={venues:venueRepo}; return venueCtl.searchVenues(req,res); });
app.get('/v1/venues/:id', (req,res)=>{ req.repositories={venues:venueRepo}; return venueCtl.getVenueById(req,res); });

const PORT = process.env.CATALOG_PORT || 3002;
app.listen(PORT, () => console.log('catalog-service listening on', PORT));
