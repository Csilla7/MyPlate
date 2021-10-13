export default class AuthenticationError extends Error {
  constructor(message = 'Invalid credentials.', status = 401) {
    super(message);
    this.name = 'Authentication error';
    this.status = status;
  }
}
