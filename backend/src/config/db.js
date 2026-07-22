import mongoose from 'mongoose';
import logger from '../logger/index.js';

let mongoServer;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/organ-transport', { serverSelectionTimeoutMS: 5000 });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.warn(`Primary DB connection failed (${error.message}), using in-memory fallback...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      const conn = await mongoose.connect(uri);
      logger.info(`MongoDB Memory Server Connected: ${conn.connection.host}`);
      
      // Auto-seed the memory database
      try {
        const { seedData } = await import('../scripts/seed.js');
        logger.info(`Auto-seeding in-memory database...`);
        await seedData();
        logger.info(`Auto-seeding complete!`);
      } catch (seedErr) {
        logger.error(`Auto-seeding failed: ${seedErr.message}`);
      }

    } catch (inMemErr) {
      logger.error(`Error starting in-memory DB: ${inMemErr.message}`);
      process.exit(1);
    }
  }
};
