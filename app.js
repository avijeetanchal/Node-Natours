const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// start express app
const app = express();

//trust proxy as heroku modifies the incoming req before it hits our app.
app.enable('trust proxy');

app.set('view engine', 'pug'); /// setting up the template engine for server side render

app.set('views', path.join(__dirname, 'views')); // views folder path
// path.join -> ensures / between the dirs

// 1) GLOBAL MIDDLEWARES
// implement cors for all Endpoint else you can do it for respective api
app.use(cors()); // get and post req only -> simple req
// access-control-allow-origin to * -> no matter from where req comes
// app.natuours.io - natuours.com // diff front end hosting
// app.use(
//   cors({
//     origin: 'https://www.natuours.com',
//   }),
// );

// non simple req -> pathc put delete, sending cookies
app.options('*', cors()); // in place of * we can have the specific endpoint

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); /// logs the req in the node console
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter); // setting limiter on /api url

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // parse the req.body as json
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // parses the data from cookie of req body

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // add field of the req timestamp in millisecs
  // console.log(`app.js middleware working. Cookie: ${req.cookies}`);
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

/// doubt
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
