export class AppError extends Error {
  constructor(statusCode = 500, message = 'Something went wrong') {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}
