const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['grains', 'vegetables', 'pulses', 'fruits', 'spices']
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true,
    default: 'kg'
  },
  description: {
    type: String,
    required: true
  },
  farmer: {
    type: String,
    required: true
  },
  farmerPhone: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: ''
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);
