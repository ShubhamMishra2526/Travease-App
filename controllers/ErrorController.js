const AppError = require('../utils/appError');
// for CastError for invalid id
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
// For duplicate name error
const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue ? err.keyValue.name : 'Unknown value';
  const message = `Duplicate field value: "${value}". Please use another value!`;
  return new AppError(message, 400);
};
// Handling validation Error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(', ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token please login again!', 401);
const handleJWTExpiredError = () =>
  new AppError('Expired token please login again!', 401);

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  // Rendered Website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};
const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational === true) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Programming error or unknown error
    // 1> Log error
    console.error('Error!', err);
    // 2> Send generic message
    return res.status(500).json({
      status: 'fail',
      message: 'Something went wrong',
    });
  }
  // Rendered Website
  // Operational, trusted error: send message to client
  if (err.isOperational === true) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  // Programming error or unknown error
  // 1> Log error
  console.error('Error!', err);
  // 2> Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  // this is a global error handling middleware
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
