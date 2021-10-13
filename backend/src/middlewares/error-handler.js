import logger from '../logger';

// eslint-disable-next-line no-unused-vars
export default (err, req, res, next) => {
  logger.error(
    `${err.status || 500} - ${err.name}: ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`,
  );
  res.status(err.status || 500);
  res.json({
    message: `${err.message}`,
  });
};