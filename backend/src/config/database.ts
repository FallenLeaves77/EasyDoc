import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/easydoc2';
const ENABLE_DATABASE = process.env.ENABLE_DATABASE === 'true';

export const connectDatabase = async (): Promise<boolean> => {
  // 如果数据库被禁用，直接返回false
  if (!ENABLE_DATABASE) {
    console.log('📝 Database connection disabled by configuration');
    console.log('⚠️ Application running in database-free mode (using in-memory storage)');
    return false;
  }

  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 3000, // 减少超时时间
      socketTimeoutMS: 45000,
      bufferCommands: false,
    };

    await mongoose.connect(MONGODB_URI, options);

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    console.log('⚠️ Application will continue without database (using in-memory storage)');
    return false;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};
