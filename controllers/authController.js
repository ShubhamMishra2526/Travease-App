const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    // secure: true, // this ensure that the cookie will only be sent on the encrypted connection
    httpOnly: true, // this ensures that the cookies cannot be accessed or modified in any way by the browser
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // now sending the jwt in http cookie as of now we were just sending the token as a string in response
  res.cookie('jwt', token, cookieOptions);
  // Remove password from the output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // By not just sending and making all the data sent by the client to be stored in DB we only allow some specific data to be stored as this will ensure that a user does not sign in as an admin
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1 Check if email and password exists
  if (!email || !password) {
    const message = 'Email or password do not exist';
    return next(new AppError(message, 400));
  }
  // 2 Check if the password is correct and user exist

  const user = await User.findOne({
    email,
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401)); // not done separately for email and password as then the attacker will get to know which field is wrong
  }

  // 3 If everything is ok, send the token back to the client
  createAndSendToken(user, 200, res);
});

// Defining a fucntion for log out route by just send the cookie as response in which the jwt has some dummy value and not the one with which user logged in
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting the token and check if its there
  // A common practise is to send the token using http header with a request in a format ==> authorization: "Bearer JWT Token"
  // Setting the header:
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // splitting the string wrt space character and then saving it into the array
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    // console.log(token);

    return next(
      new AppError('User is not login in! Please log in to get access.', 401), // 401 is for unauthorised error
    );
  }

  // 2. Validate the token(verification)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  // 3. User exists or not
  const freshUser = await User.findById(decoded.id);
  if (!freshUser)
    return next(
      new AppError('The user belonging to the token no longer exists!', 401),
    );
  // 4. Check if user changed passoword after the jwt was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User recently changed the password! Please login again.',
        401,
      ),
    );
  }
  // grant access to the protected route
  req.user = freshUser;
  res.locals.user = freshUser;

  next();
});

// only for render pages and there will be no error
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 2. Validate the token(verification)
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // console.log(decoded);
      // 3. User exists or not
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) return next();

      // 4. Check if user changed passoword after the jwt was issued
      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user so we need to make the user accessible to the template
      // res.locals is accessed by all the pug templates and here user is variable
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//Restricting some routes for authorisation
// we cannot pass a argument in the middleware fucntion so we make it happen using a wrapper function
// before the restrict middleware the protect middleware will run so we will get the access of the req.user 's access
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles is an array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
// passwrod change
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('There is no email address', 404));
  // generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // saving the updated document
  // sent it back as email

  // const message = `Forget password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset Token (Only valid for 10 mins!)',
    //   message,
    // });
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    console.log('Error sending the email:', error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1 get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2 if token has not ecpired and there is a valid user
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // saving the updated info of the user
  // 3 update changePasswordAt property for the user

  // 4 log the user in i. send the JWT token
  createAndSendToken(user, 200, res);
});
// Allowing logged in user to update his password without the whole reset process
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1 Get the user from the collection
  const user = await User.findById(req.user.id).select('+password');
  // 2 Asking for the current password before updating and verify it
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // 3 If the password is correct then update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdANDUpdate wont work as intended

  // 4 Log the user in
  createAndSendToken(user, 200, res);
});
