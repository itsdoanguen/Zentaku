const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const router = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', router);

// Handle 404 
app.use(notFound);

// Error handler 
app.use(errorHandler);

module.exports = app;