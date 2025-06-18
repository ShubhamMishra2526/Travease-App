class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];

    // .forEach as we dont want any array we just need to traverse and delete the excludedFields
    excludeFields.forEach((el) => delete queryObj[el]);

    // console.log(req.query, queryObj);
    // find is used for finding and returning all of the documents

    // const tours = await Tour.find(queryObj);
    // now the above Tour.find() returns a query so using await lets the query to execute and comeback with the documents that matches our query so there is now way of implementing sorting or pagination
    // so we save the part in the query and then chain all the methods to the query that we need to only then we await the query

    // ADVANCED FILTERING----------
    //-----------------------------
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // filter object for the query for greater than equal ==> {difficulty: 'easy', duration: {$gte : 5}}
    // $ is mongoDb operator sign

    this.query = this.query.find(JSON.parse(queryStr));

    // const query = Tour.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      // if there is a tie so we sort acc to a diffirent criteria
      // sort('price ratingsAverage')
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
      // if there is a tie so we sort acc to a diffirent criteria
      // sort('price ratingsAverage')
    } else {
      this.query = this.query.select('-__v'); // for excluding __v
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const lim = this.queryString.limit * 1 || 100;
    const sk = (page - 1) * lim;
    this.query = this.query.skip(sk).limit(lim);
    return this;
  }
}
module.exports = APIFeatures;
