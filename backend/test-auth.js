// Simple test script to check authentication
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./src/models/User');

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

async function testAuth() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminUser = await User.findOne({ email: 'admin@gmail.com' });
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin user found:', {
      email: adminUser.email,
      fullName: adminUser.fullName,
      role: adminUser.role,
      isAdmin: adminUser.isAdmin
    });

    // Create a test token
    const token = jwt.sign(
      { id: adminUser._id, role: adminUser.role, isAdmin: adminUser.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Test token created:', token.substring(0, 50) + '...');

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded:', decoded);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAuth();
