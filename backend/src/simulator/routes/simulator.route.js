import express from 'express';
import * as simulatorController from '../controllers/simulator.controller.js';

const router = express.Router();

// Execute a simulator step end-to-end (DB + Blockchain)
router.post('/execute-step', simulatorController.executeSimulatorStep);

export default router;
