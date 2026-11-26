import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import employeesRoutes from './modules/employees/routes.js';
import brandsRoutes from './modules/brands/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import { podRoutes } from './modules/pods/routes.js';
import { processRoutes } from './modules/processes/routes.js';
import { rosterRoutes } from './modules/rosters/routes.js';
import { reportsRoutes } from './modules/reports/routes.js';

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
  app.use('/api/pods', podRoutes);
  app.use('/api/processes', processRoutes);
  app.use('/api/rosters', rosterRoutes);
  app.use('/api/reports', reportsRoutes);

  app.use(errorHandler);

  return app;
}
