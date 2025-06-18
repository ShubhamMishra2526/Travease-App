const mongoose = require('mongoose');
const slugify = require('slugify');

// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // data validator
      unique: true, // not a data validator
      trim: true,
      maxLength: [40, 'A tour must have less or equal than 40 characters'],
      minLength: [10, 'A tour must have more or equal than 10 charaters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'], // custom validator of npm library for checking if the string contains only characters
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty label'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either : easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must have a minimum values of 1.0'],
      max: [5, 'Rating must have a maximum values of 5.0'],
      set: (val) => Math.round(val * 10) / 10, // setter fucntion to round off the values of the ratingAverage
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // custom validator which makes sure that the priceDiscount is less than the price
          // this only points to the current doc on NEW document creation
          // so this function not works on update as this will not work on the update
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true, // a method on strings to remove all the wide spaces from the front and the back
      required: [true, 'A tour must have a desccription'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // means a arrayof strings
    createdAt: {
      type: Date,
      default: Date.now(),
      // select: false, // permanently hiding it from the o/p as its sensitive data and we dont want to expose it
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON is data format to specify the geospatial data format
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, // for embedding the user in the tour
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    // reviews: [{ type: mongoose.Schema.ObjectId, ref: 'Review' }],
    // above is child referencing but we will not do like this we will use virtual populate
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

//INDEXING
// tourSchema.index({ price: 1 }); // means indexing based on ascending order of the price i.e 1 (single field index)
tourSchema.index({ price: 1, ratingsAverage: -1 }); // means indexing based on ascending order of the price i.e 1 (multiple field index)
tourSchema.index({ slug: 1 }); // means indexing based on ascending order of the price i.e 1 (multiple field index)
tourSchema.index({ startLocation: '2dsphere' }); // means indexing based on ascending order of the price i.e 1 (multiple field index)

// virtual property which will not be saved in the DB it will only execute and return whenever a get req is there
// used regular function as this keyword is not present in the arrow function
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// VIRTUAL POPULATE
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', // connecting the two databases using the field in the review model where the reference to the current model is stored
  localField: '_id', // specifying the field in the current model which refers to in the review model
});

// DOCUMENT middleware and it runs before an actual document is saved to the database i.e before the .save() command and the .create() command
// In this middleware we have the access to the current document being processed
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// EMBEDDING USER IN THE TOURS----------------------------------
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre('save', (next) => {
//   console.log('Will save the document...');
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//Query middleware : middleware that executes before and after any query is executed
tourSchema.pre(/^find/, function (next) {
  // /^find/ is used so as this middleware executes for all the hooks that starts with find
  // let say we want some tours only for vip members and it should be not shown to others
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});
// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

// Aggregation middleware: allows to add hooks before and after the aggregation happens
// tourSchema.pre('aggregate', function (next) {
//   // unshift add an element at the beginning of the array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
