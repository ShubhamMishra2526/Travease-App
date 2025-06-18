const Review = require('../model/reviewModel');
// const catchAsync = require('../utils/catchAsync');
// const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

const createReview = factory.createOne(Review);

const getAllReview = factory.getAll(Review);
const deleteReview = factory.deleteOne(Review);
const updateReview = factory.updateOne(Review);
const getReview = factory.updateOne(Review);

module.exports = {
  getAllReview,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
};
