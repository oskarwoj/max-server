import express from 'express';
import { errorController } from '../controllers/errorController.js';

export const errorRoutes = express.Router();

errorRoutes.get('/500', errorController.get500);

errorRoutes.get('/404', errorController.get404);

errorRoutes.use('*', errorController.get404);
