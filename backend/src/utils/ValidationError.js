export default class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'Validation error';
    this.status = status;
  }
}
