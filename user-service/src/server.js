// user-service/src/server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const express = require('express');
const ctl = require('./controllers/userController');
const repo = require('./repositories/userRepo');

const app = express();
const { correlationMiddleware } = require('./logger');

app.use(correlationMiddleware);

app.use(express.json());

app.post('/v1/users',      (req,res)=>{ req.repositories={users:repo}; return ctl.createUser(req,res); });
app.get('/v1/users',       (req,res)=>{ req.repositories={users:repo}; return ctl.listUsers(req,res); });
app.get('/v1/users/:id',   (req,res)=>{ req.repositories={users:repo}; return ctl.getUserById(req,res); });
app.patch('/v1/users/:id', (req,res)=>{ req.repositories={users:repo}; return ctl.updateUser(req,res); });
app.delete('/v1/users/:id',(req,res)=>{ req.repositories={users:repo}; return ctl.deleteUser(req,res); });
const { register } = require('./metrics');

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();   // metrics.js exposes `register`
    res.end(metrics);
  } catch (err) {
    console.error('Error generating metrics', err);
    res.status(500).send(err.message);
  }
});
const PORT = process.env.USER_PORT || 3001;
app.listen(PORT, () => console.log('user-service listening on', PORT));
