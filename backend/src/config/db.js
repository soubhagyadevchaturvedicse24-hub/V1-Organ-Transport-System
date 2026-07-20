import mongoose from 'mongoose';
import logger from '../logger/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/organ-transport', { serverSelectionTimeoutMS: 2000 });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`Primary DB connection failed, using in-memory fallback...`);
    try {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      const conn = await mongoose.connect(uri);
      logger.info(`MongoDB Memory Server Connected: ${conn.connection.host}`);
    } catch (inMemErr) {
      logger.error(`Error starting in-memory DB: ${inMemErr.message}`);
      process.exit(1);
    }
  }
};
