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
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'Organ Transport Platform API',
    version: '1.0.0'
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
