import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    type: {
      items: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
          },
          quantity: { type: Number, required: true },
        },
      ],
    },
    default: { items: [] },
  },
});

userSchema.methods.addToCart = function (product, quantity = 1) {
  const cartProductIndex = this.cart.items.findIndex(
    (cartItem) => cartItem.productId.toString() === product._id.toString(),
  );

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    // Product exists in cart, update quantity
    newQuantity = this.cart.items[cartProductIndex].quantity + quantity;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    // Add new product to cart
    updatedCartItems.push({
      productId: product._id,
      quantity: quantity,
    });
  }

  this.cart = {
    items: updatedCartItems,
  };

  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter(
    (cartItem) => cartItem.productId.toString() !== productId.toString(),
  );

  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

export const User = mongoose.model('User', userSchema);
