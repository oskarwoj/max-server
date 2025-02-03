/* eslint-disable no-undef */

// Third-party imports (alphabetical)
import compression from 'compression';
import MongoDBStore from 'connect-mongodb-session';
import express from 'express';
import session from 'express-session';
import fs from 'fs';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import path from 'path';

// Local imports (alphabetical)
import { rootDir } from '../path.js';
import { User } from './models/userModel.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { errorRoutes } from './routes/errorRoutes.js';
import { shopRoutes } from './routes/shopRoutes.js';

// Database configuration
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// Initialize app
export const app = express();
console.log('ENV:', process.env.NODE_ENV || 'development');

// Session store configuration
const MongoDBStoreSession = MongoDBStore(session);
const store = new MongoDBStoreSession({
  uri: DB,
  collection: 'sessions',
});

// File upload configuration
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().toISOString()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// View engine configuration
app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'src', 'views'));

// Middleware stack
app.use(compression());
app.use(express.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter }).single('imageUrl'));
app.use(express.static(path.join(rootDir, 'public')));
app.use('/images', express.static(path.join(rootDir, 'images')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  }),
);
app.use(helmet());

// Create logs directory if it doesn't exist
const logsDir = path.join(rootDir, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Configure access log with rotation and error handling
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), {
  flags: 'a',
});

accessLogStream.on('error', (err) => {
  console.error('Log stream error:', err);
});

// Use combined format for more comprehensive logging
app.use(morgan('combined', { stream: accessLogStream }));

// Flash message middleware
app.use((req, res, next) => {
  if (!req.session.flash) {
    req.session.flash = {};
  }

  req.flash = (type, message) => {
    req.session.flash[type] = message;
  };

  res.locals.flash = req.session.flash;
  req.session.flash = {};
  next();
});

// Authentication middleware
app.use(async (req, res, next) => {
  if (!req.session.user) {
    return next();
  }

  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return next();
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.user;
  next();
});

// Routes
app.use('/admin', adminRoutes);
app.use('/', authRoutes);
app.use('/', shopRoutes);
app.use(errorRoutes);

// Error handling middleware
app.use((error, req, res) => {
  console.error('Error:', error);
  res.status(500).redirect('/500');
});
