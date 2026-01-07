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
  max: 1000,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas
app.use('/api', routes);

const errorHandler = require('./middlewares/errorHandler');
app.get('/', (req, res) => {
  res.send('API CERNE System is running');
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
