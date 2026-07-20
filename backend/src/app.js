import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoute from './health/health.route.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'Organ Transport Platform API',
    version: '1.0.0'
  });
});

app.use('/api/v1', healthRoute);

export default app;
