import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import employeesRoutes from './modules/employees/routes.js';
import brandsRoutes from './modules/brands/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/employees', employeesRoutes);
  app.use('/api/brands', brandsRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(errorHandler);

  return app;
}
