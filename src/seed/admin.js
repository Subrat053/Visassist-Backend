// backend/src/seed/admin.js
// Seed script to create an initial admin user in the database

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User.js');

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://hotasubrat7268:B9iR7gZYsYGrl5n7@y-axis.enjjmy8.mongodb.net/?appName=y-axis';

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@y-axis.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';
    const adminFirstName = process.env.ADMIN_FIRSTNAME || 'Admin';
    const adminLastName = process.env.ADMIN_LASTNAME || 'User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);


    const adminUser = new User({
      firstName: adminFirstName,
      lastName: adminLastName,
      email: adminEmail,
      password: adminPassword, // Let pre-save hook hash it
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      phone: '',
      avatarUrl: '',
      country: '',
      profile: {},
    });

    await adminUser.save();
    console.log('Admin user created successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();
