class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // super is used for calling the parent class constructor and we do that by passing message as only message is the parameter in the parent class
    this.statusCode = statusCode; // setting the status code
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // setting the status by converting the statusCode into string and using startswith string property to check if the statusCode starts with 4
    this.isOperational = true; // this is used to check if the error is operational or not, operational errors are the ones that we create and not the ones that are created by the system like syntax error, reference error etc.
    Error.captureStackTrace(this, this.constructor); // this will create a stack trace for the error and will not include the constructor in the stack trace, this is used to get the stack trace of the error and whenever a new object is created and the cosntructor is called then it ensures that this does not goes into the stack and pollute it
  }
}

module.exports = AppError;
