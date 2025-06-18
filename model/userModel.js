const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const AppError = require('../utils/appError');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: [true, 'Email already exists'],
    lowercase: true,
    validate: [validator.isEmail, 'Enter a valid email!'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  }, // path of the file system where the photo is saved
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-Guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: [8, 'Password must be of min length 8'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE & SAVE!!
      validator: function (el) {
        return this.password === el;
      },
      message: 'Password does not match!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    // method to check if a field has been modified or not
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12); // encrypts the password with a cost of 12

  this.passwordConfirm = undefined; // only to make sure that a user has input the desired password and then there is no use
  next();
});
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  // Now there is one problem in doing this way as the issue of JWT is biut faster than implementation of this middleware so will basically subtract 1000ms from date.now so that assumibng that the passwor is changed 1s before
  next();
});

userSchema.pre(/^find/, function (next) {
  // this point to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
// DO not use async here
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  // False means not changed
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // creating a not so secure token using crypto module by specifying the number if char and then converting it to hexastring
  if (!resetToken) return new AppError('Reset token generation failed', 401);
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); // encrypting the resetToken
  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
