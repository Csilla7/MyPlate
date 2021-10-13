import mongoose from 'mongoose';
import logger from './logger';
import { fillRequiredCollections } from './data/requiredData/dataManagerFns';

const { MONGO_CONNECTION_URI } = process.env;

const connectDB = async () => {
  try {
    const db = await mongoose.connect(MONGO_CONNECTION_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });

    logger.info(`MongoDB Connected: ${db.connection.host} ${db.connection.port}`);

    await fillRequiredCollections();
  } catch (err) {
    logger.error(`Mongoose error on start: ${err.message}`);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    // mongoose will attempt to reconnect
    logger.error(`Mongoose connection error: ${err.message}`);
  });

  if (process.env.NODE_ENV !== 'test') {
    mongoose.connection.on('disconnected', () => {
      logger.error('Mongoose disconnected.');
      process.exit(1);
    });
  }
};

export default connectDB;
