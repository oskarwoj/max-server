import express from 'express';
import validator from 'express-validator';
import { authController } from '../controllers/authController.js';

export const authRoutes = express.Router();

authRoutes
  .route('/login')
  .get(authController.getLogin)
  .post(authController.postLogin);

authRoutes.route('/logout').post(authController.postLogout);

authRoutes
  .route('/signup')
  .get(authController.getSignup)
  .post(
    [
      validator
        .body('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
      validator
        .body('password')
        .trim()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .custom((value) => {
          if (value === 'aa') {
            throw new Error('This is not aa');
          }
          return true;
        }),
      validator
        .body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Passwords must match!');
          }
          return true;
        }),
    ],
    authController.postSignup,
  );

authRoutes
  .route('/reset')
  .get(authController.getReset)
  .post(authController.postReset);

authRoutes
  .route('/new-password/:token')
  .get(authController.getNewPassword)
  .post(authController.postNewPassword);
