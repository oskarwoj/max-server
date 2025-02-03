/* eslint-disable no-undef */
import ejs from 'ejs';
import nodemailer from 'nodemailer';

import { htmlToText } from 'html-to-text';
import { rootDir } from '../../path.js';

export class Email {
  constructor(user, url) {
    this.to = user.email;
    this.from = process.env.EMAIL_FROM;
    this.firstName = user.email.split('@')[0];
    this.url = url;
  }

  newTransport() {
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  async send(template, subject) {
    const html = await ejs.renderFile(
      `${rootDir}/src/views/email/${template}.ejs`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Max Family');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes).',
    );
  }
}
