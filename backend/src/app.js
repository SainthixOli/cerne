const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('API Sistema de Filiação Sindicato is running');
});

module.exports = app;
