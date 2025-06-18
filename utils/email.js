const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
require('dotenv').config();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Shubham Mishra <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // Send the actual email
    // 1> Render HTML for the email based on the pug template
    // Now earlier we used to send response to render the mentioned template but here we need to create a template and send in the email and not just redirect to the template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );
    // 2> Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
      // html:
    };
    //3> Create a transport and send the email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
    );
  }
};

// const sendEmail = async (options) => {
// 1. Create a transporter
// Transporter is basically a service that will actually send the email
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });
// 2. Define the email options
// const mailOptions = {
//   from: 'Sahil Mishra <sahil@gmail.com>',
//   to: options.email,
//   subject: options.subject,
//   text: options.message,
//   // html:
// };
// 3. Actually Send the email with nodemailer
// await transporter.sendMail(mailOptions);
// };
// module.exports = sendEmail;
