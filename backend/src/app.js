import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoute from './health/health.route.js';

import authRoute from './auth/routes/auth.route.js';
import hospitalRoute from './hospital/routes/hospital.route.js';
import donorRoute from './donor/routes/donor.route.js';
import organRoute from './organ/routes/organ.route.js';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
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
app.use('/api/v1', healthRoute);

app.use(errorHandler);

export default app;
