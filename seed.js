// seed.js – Create a test farmer account
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agripredict';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Delete existing test user if any
    await User.deleteOne({ phone: '9391357351' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const testUser = new User({
      name: 'Rakesh Maladi',
      phone: '9391357351',
      password: hashedPassword,
      email: 'rakeshmaladi77@gmail.com'
    });

    await testUser.save();
    console.log('\n✅ Test Account Created Successfully!');
    console.log('-----------------------------------');
    console.log('Phone:    9391357351');
    console.log('Password: password123');
    console.log('-----------------------------------\n');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
