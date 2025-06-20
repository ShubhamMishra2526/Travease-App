const express = require('express');
const authController = require('../controllers/authController');

const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(authController.protect);

router.get(
  '/checkout_session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession,
);

router.use(authController.restrictTo('admin', 'lead-Guide'));

router
  .route('/')
  .get(bookingController.getAllBooking)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
module.exports = router;
