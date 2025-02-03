import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { authController } from '../controllers/authController.js';

export const adminRoutes = express.Router();

adminRoutes.use(authController.isAuth);

adminRoutes.get('/products', adminController.getProducts);
adminRoutes.get('/add-product', adminController.getAddProduct);
adminRoutes.post('/add-product', adminController.postAddProduct);
adminRoutes.post('/edit-product', adminController.postEditProduct);

adminRoutes.get('/edit-product/:productId', adminController.getEditProduct);
adminRoutes.delete('/product/:productId', adminController.deleteProduct);
