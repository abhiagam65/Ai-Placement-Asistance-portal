import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';

  try {
    // Attempt standard connection with 2.5s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
      connectTimeoutMS: 2500,
    });
    console.log(`[DB] Connected to MongoDB at: ${uri}`);
  } catch (err) {
    console.warn(`[DB] Could not connect to external MongoDB (${err.message}). Starting in-memory MongoDB fallback...`);
    try {
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: 'placement_portal_memory'
        }
      });
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[DB] Successfully connected to in-memory MongoDB at: ${memoryUri}`);
      console.log(`[DB] Real Mongoose schemas, queries, and persistence are active for this runtime session.`);
    } catch (memErr) {
      console.error(`[DB] In-memory MongoDB failed to start: ${memErr.message}`);
      throw memErr;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error(`[DB] Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('[DB] Mongoose disconnected.');
  });
};

export const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('[DB] Database connection closed.');
  } catch (err) {
    console.error(`[DB] Error closing database connection: ${err.message}`);
  }
};
