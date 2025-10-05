// Script to manually set a user as admin
// Usage: node scripts/setAdmin.js <email>

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/User');

async function setAdmin(email) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    console.log('Current user data:', {
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isAdmin: user.isAdmin
    });

    // Set user as admin
    user.isAdmin = true;
    await user.save();

    console.log('✅ User has been set as admin successfully!');
    console.log('Updated user data:', {
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isAdmin: user.isAdmin
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('Please provide an email address');
  console.log('Usage: node scripts/setAdmin.js <email>');
  process.exit(1);
}

setAdmin(email);
