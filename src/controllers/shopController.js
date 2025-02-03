/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import Stripe from 'stripe';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';

import { rootDir } from '../../path.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const ITEMS_PER_PAGE = 2;

const stripeClient = Stripe(process.env.STRIPE_SECRET_KEY);

const getIndex = asyncHandler(async (req, res, next) => {
  const page = +req.query.page || 1;
  const totalProducts = await Product.countDocuments();

  const products = await Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);

  if (!products) {
    return next(new AppError(400, 'Products not found'));
  }
  res.render('shop/index', {
    prods: products,
    pageTitle: 'Shop',
    path: '/',
    currentPage: page,
    totalProducts,
    hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
    hasPreviousPage: page > 1,
    nextPage: page + 1,
    previousPage: page - 1,
    lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE),
  });
});

const getProducts = asyncHandler(async (req, res, next) => {
  const page = +req.query.page || 1;
  const totalProducts = await Product.countDocuments();

  const products = await Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);

  if (!products) {
    return next(new AppError(400, 'Products not found'));
  }
  res.render('shop/product-list', {
    prods: products,
    pageTitle: 'Products',
    path: '/products',
    currentPage: page,
    totalProducts,
    hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
    hasPreviousPage: page > 1,
    nextPage: page + 1,
    previousPage: page - 1,
    lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE),
  });
});

const getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new AppError(400, 'Products not found'));
  }

  res.render('shop/product-detail', {
    product,
    pageTitle: product.title,
    path: '/products',
  });
});

const postCart = async (req, res) => {
  const product = await Product.findById(req.body.productId);

  await req.user.addToCart(product);

  res.redirect('/');
};

const getCart = async (req, res, next) => {
  const user = await req.user.populate('cart.items.productId');

  if (!user) {
    return next(new AppError(404, 'No products found'));
  }

  const products = user.cart.items;

  res.render('shop/cart', {
    pageTitle: 'Your cart',
    path: '/cart',
    products,
  });
};

const postCartDeleteProduct = async (req, res) => {
  await req.user.removeFromCart(req.body.productId);

  res.location(req.get('Referrer') || '/');
};

const getOrders = async (req, res) => {
  const orders = await Order.find({ 'user.userId': req.user._id });

  res.render('shop/orders', {
    pageTitle: 'Orders',
    path: '/orders',
    orders,
  });
};

const postOrder = asyncHandler(async (req, res, next) => {
  const user = await req.user.populate('cart.items.productId');

  if (!user.cart.items.length) {
    return next(new AppError(400, 'No items in cart'));
  }

  const products = user.cart.items.map((item) => ({
    quantity: item.quantity,
    product: { ...item.productId._doc },
  }));

  await Order.create({
    products,
    user: {
      email: req.user.email,
      userId: req.user._id,
    },
  });

  await req.user.clearCart();
  res.redirect('/orders');
});

const getCheckoutSuccess = asyncHandler(async (req, res, next) => {
  const user = await req.user.populate('cart.items.productId');

  if (!user.cart.items.length) {
    return next(new AppError(400, 'No items in cart'));
  }

  const products = user.cart.items.map((item) => ({
    quantity: item.quantity,
    product: { ...item.productId._doc },
  }));

  await Order.create({
    products,
    user: {
      email: req.user.email,
      userId: req.user._id,
    },
  });

  await req.user.clearCart();
  res.redirect('/orders');
});

const getInvoice = asyncHandler(async (req, res, next) => {
  const { orderId } = req.params;
  const invoiceName = `invoice-${orderId}.pdf`;

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new AppError(404, 'Order not found'));
  }

  if (order.user.userId.toString() !== req.user._id.toString()) {
    return next(new AppError(403, 'Unauthorized'));
  }

  const pdfDoc = new PDFDocument();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);

  pdfDoc.pipe(
    fs.createWriteStream(path.join(rootDir, 'data', 'invoices', invoiceName)),
  );
  pdfDoc.pipe(res);

  pdfDoc.fontSize(26).text('Invoice', {
    underline: true,
  });
  pdfDoc.text('-----------------------');

  let totalPrice = 0;
  order.products.forEach((prod) => {
    totalPrice += prod.quantity * prod.product.price;
    pdfDoc
      .fontSize(14)
      .text(
        `${prod.product.title} - ${prod.quantity} x $${prod.product.price}`,
      );
  });

  pdfDoc.text('---');
  pdfDoc.fontSize(20).text(`Total Price: $${totalPrice}`);

  pdfDoc.end();
});

const getCheckout = asyncHandler(async (req, res, next) => {
  const user = await req.user.populate('cart.items.productId');

  if (!user) {
    return next(new AppError(404, 'User not found'));
  }

  const products = user.cart.items;

  if (!products.length) {
    return next(new AppError(400, 'No items in cart'));
  }

  const total = products.reduce(
    (sum, p) => sum + p.quantity * p.productId.price,
    0,
  );

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/checkout/success`,
    cancel_url: `${req.protocol}://${req.get('host')}/checkout/cancel`,
    line_items: products.map((p) => ({
      quantity: p.quantity,
      price_data: {
        currency: 'usd',
        unit_amount: p.productId.price * 100,
        product_data: {
          name: p.productId.title,
          description: p.productId.description,
        },
      },
    })),
    customer_email: req.user.email,
    client_reference_id: req.user._id.toString(),
  });

  res.render('shop/checkout', {
    pageTitle: 'Checkout',
    path: '/checkout',
    products: user.cart.items,
    totalSum: total,
    sessionId: session.id,
  });
});

export const shopController = {
  getIndex,
  getProducts,
  getProduct,
  postCart,
  getCart,
  getCheckout,
  getOrders,
  postOrder,
  postCartDeleteProduct,
  getCheckoutSuccess,
  getInvoice,
};
