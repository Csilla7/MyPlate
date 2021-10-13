import jwt from 'jsonwebtoken';
import AuthorizationError from '../utils/AuthorizationError';
import { authErrors } from '../utils/errorMessages';

export const checkToken = async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization
    && req.headers.authorization.startsWith('Bearer')
  ) {
    [, token] = req.headers.authorization.split(' ');
  }

  if (!token) {
    const error = new AuthorizationError(authErrors.noPermission);
    return next(error);
  }

  req.user = jwt.verify(token, process.env.JWT_SECRET, (err, result) => {
    if (err) {
      const error = new AuthorizationError(authErrors.regOrlog);
      return next(error);
    }
    return result;
  });
  return next();
};
