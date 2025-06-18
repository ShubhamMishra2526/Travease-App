const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../model/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only image.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

const resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Processing the cover image
  const imageCoverFileName = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFileName}`); // saving after resizing

  req.body.imageCover = imageCoverFileName; // as updateTour uses the updateOne factory function which take the req.body and updates everything present in it

  // 2) Images
  req.body.images = [];
  // Below we didnt used the foreach loop as we were using async await inside the loop and it doesnt guarantee await outside the loops so basically we use map and do promise.all so that untill all or any of the promises gets resolved or rejected the loop doesnt moves forward

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-image-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );
  console.log();
  next();
});

// ALIASING
const aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingAverage,price';
  req.query.fields = 'name,price,ratingAverage,summary,difficulty';
  next();
};

//--------------------------------------------------------------------------------
// Implementing CRUD operation

const getAllTours = factory.getAll(Tour);

const getTour = factory.getOne(Tour, { path: 'reviews' });

// console.log(req.params);

// const id = req.params.id * 1;
// trick to convert string digit to a number

// find method will create an array which will only contain the element satisfying the condition
// const tour = tours.find((el) => el.id === id);

// res.status(200).json({
//   status: 'success',
//   // results: tours.length,
//   data: {
//     tour,
//   },
// });
// });

const createTour = factory.createOne(Tour);
const updateTour = factory.updateOne(Tour);

//shifting the below deletetour to factory function

// const deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);
//   if (tour === null) {
//     return next(new AppError('No tour found with that ID', 404));
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

const deleteTour = factory.deleteOne(Tour);

//--------------------------------------------------------------------------------

const getTourStats = catchAsync(async (req, res, next) => {
  // aggregation pipelines are used to process the information through different stages and produce the result
  const stats = await Tour.aggregate([
    //defining stages
    {
      $match: { ratingAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: '$ratingAverage',
        _id: { $toUpper: '$difficulty' },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        numTours: { $sum: 1 },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats },
  });
});

const getMonthlyplan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // It basically deconstruct the array field in the given document and gives us one field of each element in a document
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numToursStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }, // first longitude and then latitude
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400,
      ),
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',

    data: {
      data: distances,
    },
  });
});

module.exports = {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyplan,
  getToursWithin,
  getDistances,
  resizeTourImages,
  uploadTourImages,
};
