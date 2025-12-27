const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Limit requests (100 per 15 mins)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('API Sistema de Filiação Sindicato is running');
});

module.exports = app;
