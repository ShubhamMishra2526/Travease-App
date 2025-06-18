const express = require('express');
const authController = require('../controllers/authController');

const {
  createReview,
  getAllReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require('../controllers/reviewController');

const router = express.Router({
  mergeParams: true, // by default each router has access to there routes params so using this we can merge the parameters from tourroutes also where this router is used
}); // so both routes like  POST /tour/id/reviews and POST/reviews will get access to the below handler

router.use(authController.protect);

router
  .route('/')
  .get(getAllReview)
  .post(authController.restrictTo('user'), setTourUserIds, createReview);
router
  .route('/:id')
  .get(getReview)
  .patch(authController.restrictTo('user', 'admin'), updateReview)
  .delete(authController.restrictTo('user', 'admin'), deleteReview);
module.exports = router;
