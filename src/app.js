const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const router = require('./routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger UI Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MyAnilist API Docs',
  customfavIcon: '/assets/favicon.ico'
}));

// API Routes
app.use('/api', router);

// Handle 404 
app.use(notFound);

// Error handler 
app.use(errorHandler);

module.exports = app;