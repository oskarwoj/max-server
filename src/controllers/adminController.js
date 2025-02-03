import Product from '../models/productModel.js';
import { ApiFeatures } from '../utils/apiFeatures.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { deleteFile } from '../utils/file.js';

const getAddProduct = (req, res) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
  });
};

const postAddProduct = asyncHandler(async (req, res, next) => {
  const { title, description, price } = req.body;
  const image = req.file;

  if (!image) {
    return next(new AppError(422, 'Please provide an image'));
  }
  const imageUrl = image.path;

  console.log('image', image);
  console.log('imageUrl', imageUrl);

  const product = await Product.create({
    title,
    description,
    imageUrl,
    price,
    userId: req.user._id,
  });

  if (!product) {
    return next(new AppError(422, 'Failed to create product'));
  }

  res.redirect('/admin/products');
});

const getProducts = asyncHandler(async (req, res, next) => {
  const features = new ApiFeatures(
    Product.find({ userId: req.user._id }),
    req.query,
  );
  const products = await features.query;

  if (!products) {
    return next(new AppError(404, 'No products found'));
  }

  res.render('admin/products.ejs', {
    prods: products,
    pageTitle: 'Admin Products',
    path: '/admin/products',
  });
});

const getEditProduct = asyncHandler(async (req, res, next) => {
  const editMode = Boolean(req.query.edit);
  const product = await Product.findById(req.params.productId);

  if (!editMode) {
    return res.redirect('/');
  }

  if (!product) {
    return next(new AppError(404, ' Product not found'));
  }

  res.render('admin/edit-product', {
    pageTitle: 'Edit product',
    path: '/admin/edit-product',
    product,
    editing: editMode,
  });
});

const postEditProduct = asyncHandler(async (req, res, next) => {
  const { productId, title, description, price } = req.body;
  const image = req.file;

  // Find the existing product
  const product = await Product.findOne({
    _id: productId,
    userId: req.user._id,
  });

  if (!product) {
    return next(new AppError(404, 'Product not found'));
  }

  // Update the product
  const updateData = {
    title,
    description,
    price,
  };

  // Only update imageUrl if a new image was uploaded
  if (image) {
    await deleteFile(product.imageUrl);
    updateData.imageUrl = image.path;
  }

  await Product.updateOne(
    { _id: productId, userId: req.user._id },
    updateData,
    { runValidators: true },
  );

  res.redirect('/admin/products');
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findOne({
    _id: req.params.productId,
    userId: req.user._id,
  });

  console.log('req.params.productId', req.params.productId);
  console.log('eq.user._id', req.user._id);

  if (!product) {
    return next(new AppError(404, 'Product not found'));
  }

  const imageUrl = product.imageUrl;

  await Product.deleteOne({ _id: req.params.productId, userId: req.user._id });

  await deleteFile(imageUrl);

  res.status(200).json({
    status: 'success',
  });
});

export const adminController = {
  getAddProduct,
  postAddProduct,
  getProducts,
  getEditProduct,
  postEditProduct,
  deleteProduct,
};
