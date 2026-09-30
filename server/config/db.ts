import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('❌ MONGO_URI not set in .env');

  if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', false); // set true to see every query
  }

  mongoose.connection.on('connected', () =>
    console.log(`✅ MongoDB → ${mongoose.connection.host}/${mongoose.connection.name}`)
  );
  mongoose.connection.on('error', (err) =>
    console.error('❌ MongoDB error:', err.message)
  );
  mongoose.connection.on('disconnected', () =>
    console.warn('⚠️  MongoDB disconnected')
  );

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
}


/***export const db: any = new Proxy({}, {
  get(_target, prop) {
    throw new Error(
      `Legacy 'db.${String(prop)}' accessed. ` +
      `Migrate this file to import models from '../models/schemas.ts' instead.`
    );
  },
});  */