import cors from 'cors';
import dotenv from 'dotenv';
import express, { type Application, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import container from './config/container';
import { swaggerSpec, swaggerUi } from './config/swagger';
import { errorHandler, notFound } from './middlewares/errorHandler';

dotenv.config();

container.initialize();

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inject container into request
app.use((req: Request, _res: Response, next: NextFunction) => {
  req.container = container;
  next();
});

// Swagger UI Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MyAnilist API Docs',
    customfavIcon: '/assets/favicon.ico',
  })
);

// API Routes
const router = require('./routes')(container);
app.use('/api', router);

// Handle 404
app.use(notFound);

// Error handler
app.use(errorHandler);

export default app;
