/* eslint-disable import/first */
import logger from './logger';
import connectDB from './db';

connectDB();

import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`App is listening on ${PORT}`);
});
