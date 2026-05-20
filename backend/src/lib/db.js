import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('DATABASE_URL is not set');
  }
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
