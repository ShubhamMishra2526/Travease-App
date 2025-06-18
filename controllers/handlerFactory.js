const APIFeatures = require('../utils/APIFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (doc === null) {
      return next(new AppError('No doc found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // this will ensure that the data is valid as per our requirements in the model
      // this way the new updated document will be returned rather than the original. defaults to false.
    });
    if (doc === null) {
      return next(new AppError('No doc found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // TRYCATCH BLOCK IS REMOVED AND INSTEAD CATCHASYNC FUNCTION IS USED
    // Below creating new tour object of Tour model and then saving the data on that
    // const newTour = new Tour({});
    // newTour.save()

    //easier way directly using create on Tour model and returns promise so will use .then
    const doc = await Model.create(req.body);
    // status code 201 for created
    res.status(201).json({
      status: 'success',
      data: {
        tour: doc,
      },
    });
  });
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // For using the populate we need to first pass the reference for which we will populate the data
    // so first we made a query and then checked and populate if req and then we awaited for the query
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    // findbyid is used to finding a specific element by an id
    // const doc = await Model.findById(req.params.id).populate('reviews'); // populating the guides field in order to get the user info just like embedded one

    if (doc === null) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      // results: docs.length,
      data: {
        data: doc,
      },
    });
  });
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // to allow for nested get review on tours
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // EXECUTE THE QUERY
    //------------------------------
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;

    //SEND RESPONSE
    //------------------------------

    res.status(200).json({
      status: 'success',
      // requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc,
      },
    });
  });
