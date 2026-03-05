const mongoose = require('mongoose');

const connectDB = async () => {
  // If a MONGO_URI is provided, use it directly
  if (process.env.MONGO_URI) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
      process.exit(1);
    }
  }

  // Try local MongoDB first
  try {
    const conn = await mongoose.connect('mongodb://localhost:27017/syncsound', {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.log('Local MongoDB not available, starting in-memory MongoDB...');
  }

  // Fallback to in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('Downloading MongoDB binary (first time only, may take a minute)...');
    const mongod = await MongoMemoryServer.create({
      instance: {
        launchTimeout: 120000
      }
    });
    const uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
    console.log('⚠️  Data will be lost when server restarts (using in-memory DB)');
  } catch (error) {
    console.error(`Failed to start in-memory MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
