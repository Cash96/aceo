import mongoose from 'mongoose';
import { logger } from '@/utils/logger';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectMongo() {
  if (cached.conn) {
    // logger.debug('🔄 Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    // logger.info('🔌 Connecting to MongoDB...', { dbName: 'aceocluster' });
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: 'aceocluster',
    });
  }

  try {
    cached.conn = await cached.promise;
    logger.info('✅ MongoDB connected successfully', {
      host: cached.conn.connection.host,
      dbName: cached.conn.connection.name,
    });
    return cached.conn;
  } catch (error: any) {
    logger.error('❌ MongoDB connection failed', { error: error.message });
    cached.promise = null; // reset so we can retry
    throw error;
  }
}
