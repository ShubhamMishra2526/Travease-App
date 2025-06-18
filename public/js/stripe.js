/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51Rae0fSHI3nBte57WRvyNftdcIYSLkvjQo1SXX1v1mcwMrd35mtGX6vqvUmIVLstYjGLG8gGl3XxTgqaqpwvhO0a00QsQAfktI',
);

export const bookTour = async (tourId) => {
  try {
    // 1) get the session from the server
    const session = await axios(`/api/v1/booking/checkout_session/${tourId}`);
    // console.log(session);
    // 2) create checkout-form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert(
      'error',
      err.response?.data?.message ||
        err.message ||
        'Something went wrong during checkout.',
    );
  }
};
