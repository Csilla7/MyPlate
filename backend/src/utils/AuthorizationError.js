import { authErrors } from './errorMessages';

export default class AuthorizationError extends Error {
  constructor(message = authErrors.regOrlog, status = 403) {
    super(message);
    this.name = 'Authorization error';
    this.status = status;
  }
}
