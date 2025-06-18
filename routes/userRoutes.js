const express = require('express');
const multer = require('multer');
const authController = require('../controllers/authController');

const router = express.Router();
const {
  getAllusers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
} = require('../controllers/userController');

router.post('/signup', authController.signup); // this does not follow REST philosophy
router.post('/login', authController.login); // this does not follow REST philosophy
router.get('/logout', authController.logout); // this does not follow REST philosophy
router.post('/forgotPassword', authController.forgotPassword); // this does not follow REST philosophy
router.patch('/resetPassword/:token', authController.resetPassword); // this does not follow REST philosophy

// Protect all routes after this middleware
router.use(authController.protect);
router.patch('/updateMyPassword/', authController.updatePassword);
router.get('/me', getMe, getUser);
router.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
router.patch('/deleteMe', deleteMe);

router.use(authController.restrictTo('admin'));

router.route('/').get(getAllusers).post(createUser);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
