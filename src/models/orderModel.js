import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  products: [
    {
      product: { type: Object, required: true },
      quantity: { type: Object, required: true },
    },
  ],

  user: {
    email: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
});

export default mongoose.model('Order', orderSchema);
