import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoute from './health/health.route.js';

import authRoute from './auth/routes/auth.route.js';
import hospitalRoute from './hospital/routes/hospital.route.js';
import donorRoute from './donor/routes/donor.route.js';
import organRoute from './organ/routes/organ.route.js';
import matchingRoutes from './matching/routes/matching.route.js';
import recipientRoutes from './recipient/routes/recipient.route.js';
import boxRoutes from './transport/routes/box.route.js';
import missionRoutes from './transport/routes/mission.route.js';
import deviceRoutes from './transport/routes/device.route.js';
import auditRoutes from './blockchain/routes/audit.route.js';
import specRoute from './transport/routes/spec.route.js';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'Organ Transport Platform API',
    version: '1.0.0',
    status: 'Running'
  });
});

app.get(['/api/v1', '/api/v1/'], (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Organ Transport System API v1',
    documentation: 'https://github.com/soubhagyadevchaturvedicse24-hub/V1-Organ-Transport-System',
    endpoints: {
      auth: '/api/v1/auth',
      hospitals: '/api/v1/hospitals',
      donors: '/api/v1/donors',
      organs: '/api/v1/organs',
      matching: '/api/v1/matching',
      transport: '/api/v1/transport/missions',
      audit: '/api/v1/audit/blocks',
      health: '/api/v1/health',
    }
  });
});

app.use('/api/v1/auth', authRoute);
app.use('/api/v1/hospitals', hospitalRoute);
app.use('/api/v1/donors', donorRoute);
app.use('/api/v1/organs', organRoute);
app.use('/api/v1/matching', matchingRoutes);
app.use('/api/v1/recipients', recipientRoutes);
app.use('/api/v1/transport/boxes', boxRoutes);
app.use('/api/v1/transport/missions', missionRoutes);
app.use('/api/v1/device', deviceRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1', healthRoute);
app.use('/api', specRoute);

app.use(errorHandler);

export default app;
