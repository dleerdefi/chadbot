const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: './keys.env' }); 

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

async function makeAdmin(email) {
  try {
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { isAdmin: true } },
      { new: true }
    );
    if (user) {
      console.log(`User ${user.email} is now an admin.`);
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    mongoose.connection.close();
  }
}

const emailToMakeAdmin = process.argv[2];
if (!emailToMakeAdmin) {
  console.log('Please provide an email address as an argument.');
  process.exit(1);
}

makeAdmin(emailToMakeAdmin);