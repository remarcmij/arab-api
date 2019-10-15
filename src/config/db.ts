import mongoose from 'mongoose';
import logger from '../config/logger';
import { assertEnvVar } from '../util';
import seed from './seed';

const connectDB = async () => {
  try {
    assertEnvVar('MONGO_CONNECT_STRING');
    await mongoose.connect(process.env.MONGO_CONNECT_STRING!, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected');
    await seed();
  } catch (err) {
    logger.error(err.message);
    process.exit(1);
  }
};

export default connectDB;
