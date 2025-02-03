import express from 'express';
import { authController } from '../controllers/authController.js';
import { shopController } from '../controllers/shopController.js';

export const shopRoutes = express.Router();

shopRoutes.get('/', shopController.getIndex);
shopRoutes.get('/products', shopController.getProducts);

shopRoutes.get('/products/:productId', shopController.getProduct);

shopRoutes.use(authController.isAuth);

shopRoutes
  .route('/cart')
  .get(shopController.getCart)
  .post(shopController.postCart);
shopRoutes.post('/cart-delete-item', shopController.postCartDeleteProduct);

shopRoutes.get('/checkout', authController.isAuth, shopController.getCheckout);
shopRoutes.get('/checkout/success', shopController.getCheckoutSuccess);
shopRoutes.get('/checkout/cancel', shopController.getCheckout);

shopRoutes.get('/orders', shopController.getOrders);

shopRoutes.get(
  '/orders/:orderId',
  authController.isAuth,
  shopController.getInvoice,
);
