/* eslint-disable */

import '@babel/polyfill';
import { displayMap } from './mapbox';
import { bookTour } from './stripe';
import { login, logout, signup } from './login';
import { updateSettings } from './updateSettings';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordChange = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');
const signupForm = document.querySelector('.form--signup');

// DELEGATIONS
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // VALUES
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (signupForm) {
  console.log('✅ SUCCESS: Signup Form found in HTML!');

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('👆 BUTTON CLICKED: Form is submitting...');

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    console.log('📝 DATA COLLECTED:', {
      name,
      email,
      password,
      passwordConfirm,
    });

    signup(name, email, password, passwordConfirm);
  });
} else {
  console.log('❌ ERROR: Could not find element with class .form--signup');
}

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // Creating multipart form data in order to access the file which we have sent for photo
    // We need to mention (enctype='multipart/form-data') in html form with action and method but by using API we need to do it programitically
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // console.log(form);
    // const data = { email, name };
    updateSettings(form, 'data');
  });

if (userPasswordChange)
  userPasswordChange.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save--password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    const data = { passwordCurrent, password, passwordConfirm };
    await updateSettings(data, 'password');

    document.querySelector('.btn--save--password').textContent =
      'Save password';
    document.getElementById('password-current').value = 'empty';
    document.getElementById('password').value = 'empty';
    document.getElementById('password-confirm').value = 'empty';
  });

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    try {
      e.target.textContent = 'Processing...';
      const { tourId } = e.target.dataset;
      bookTour(tourId);
    } catch (err) {
      console.error('Error booking tour:', err);
    }
  });
}
