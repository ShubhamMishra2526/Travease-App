const express = require('express');
const authController = require('../controllers/authController');
const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  aliasTopTours,
  deleteTour,
  getTourStats,
  getMonthlyplan,
  getToursWithin,
  getDistances,
  resizeTourImages,
  uploadTourImages,
} = require('../controllers/tourController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// Implementing nested routing for getting the reviews of certain tour with tour id in the URL and also creating a review for the currently logged in user and for the current tour and the hard coded one as we were using
// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview,
//   );

router.use('/:tourId/reviews', reviewRouter);

// router.param('id', checkID);

// Middleware to check body of the request for createTour and check if the body has name and price property
// if not then send a 400(bad request) status code
// add it to post handler stack

// aliasing for most asked
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/tour-stats').get(getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-Guide', 'guide'),
    getMonthlyplan,
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin);

router.route('/distances/:latlng/:unit').get(getDistances);

// authcontroller protects the get all tours from un authenticated user
router
  .route('/')
  .get(getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-Guide'),
    createTour,
  );

router
  .route('/:id')
  .get(getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-Guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-Guide'),
    deleteTour,
  );

module.exports = router;
