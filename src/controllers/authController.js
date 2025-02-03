import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import { User } from '../models/userModel.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Email } from '../utils/email.js';

const getLogin = (req, res) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
  });
};

const postLogin = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash('error', 'Invalid email');
    return res.redirect('/login');
  }

  const isCorrectPassword = await bcrypt.compare(password, user.password);

  if (!isCorrectPassword) {
    return res.redirect('/login');
  }

  req.session.user = user;

  req.session.save((err) =>
    err ? console.log('err', err) : res.redirect('/'),
  );
});

const postLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      req.flash('error', 'Logout failed');
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.redirect('/');
  });
};

const getSignup = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    oldInput: {
      email,
      password,
      confirmPassword,
    },
  });
};

const postSignup = asyncHandler(async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.render('auth/signup', {
      path: 'signup',
      pageTitle: 'Signup',
      errorMessage: errors.array(),
      oldInput: {
        email,
        password,
        confirmPassword,
      },
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      cart: { items: [] },
    });

    await new Email(newUser, 'http://localhost:8000/product').sendWelcome();
  }

  res.redirect('/login');
});

const isAuth = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
};

const getReset = (req, res) => {
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
  });
};

const postReset = asyncHandler(async (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  const user = await User.findOne({ email: req.body.email });

  user.resetToken = token;
  user.resetTokenExpiration = Date.now() + 60 * 60 * 1000;

  await user.save();

  const resetToken = `${req.protocol}://${req.get('host')}/new-password/${token}`;
  await new Email(user, resetToken).sendPasswordReset();

  res.redirect('/');
});

const getNewPassword = async (req, res) => {
  res.render('auth/new-password', {
    path: '/new-password',
    pageTitle: 'New Password',
    token: req.params.token,
  });
};

const postNewPassword = async (req, res, next) => {
  const token = req.params.token;
  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('400', 'Invalid or expired password reset token'));
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  user.password = hashedPassword;
  user.resetToken = undefined;
  user.resetTokenExpiration = undefined;

  await user.save();

  res.redirect('/');
};

export const authController = {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
  isAuth,
  getReset,
  postReset,
  getNewPassword,
  postNewPassword,
};
