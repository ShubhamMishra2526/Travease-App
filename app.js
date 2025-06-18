const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const XSS = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const compression = require('compression');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/ErrorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const app = express();

// Defining view engine i.e pug templates
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global MIDDLEWARES
//------------------------------------------------------------
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// app.use((req, res, next) => {
//   res.setHeader(
//     'Content-Security-Policy',
//     "default-src 'self'; " +
//       "script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
//       "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; " +
//       "font-src 'self' https://fonts.gstatic.com; " +
//       "img-src 'self' data: blob:; " +
//       "worker-src 'self' blob:; " +
//       "connect-src 'self' https://api.maptiler.com;", // Add other APIs if needed
//   );
//   next();
// });

// below are the middlewares which will be stacked for all the requests
// Set security HTTP
app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

// Developmet Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// Limiting request from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // blocked window in ms
  message: 'To many request from this IP. Please try again in an hour!',
});

app.use('/api', limiter);

// Body parse
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // encoding the url sent by the form during submit-user-data
app.use(cookieParser());

// Data sanitization against No Sql query injection
// There is a way if we know the password and we set email: {$gt: ""} which is always true
app.use(mongoSanitize());

// Data sanitization against cross site scripting attacks
app.use(XSS());

// http parameter pollution
// if we use sort=durationa&sort=price in url then we will get an error as the query is not a string anymore, its a array and we cannot use split on this
app.use(
  hpp({
    // now for some properties we want there union or intersection for different values so we basically whitelist them
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression());

// express.static() is a built-in middleware function in Express. It serves static files and is based on serve-static. It can take a path as an argument and will serve the files in that directory. The path can be absolute or relative to the current working directory. The path can also be a URL.

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// 2) ROUTES
//------------------------------------------------------------
// below are the specific route handlers as they are defined for specific routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// handling all the routes that are not catched by the above routes
app.all('*', (req, res, next) => {
  // Error is inbuilt express object which is used to create an error object
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.statusCode = 404;
  // err.status = 'fail';

  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // passng an arg in the next function will skill all the middlewares that are present in the stack and will go to global error handling middleware
});

// Global error handling middleware
// this is the error first callback pattern
app.use(globalErrorHandler);

// 3) SERVER
//------------------------------------------------------------
module.exports = app;
