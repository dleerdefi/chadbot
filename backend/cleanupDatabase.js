const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

console.log('MONGO_URI:', process.env.MONGO_URI);

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not defined in the environment variables');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected for cleanup'))
  .catch(err => console.error('MongoDB connection error:', err));

const botFullNames = ['RossJeffries', 'JohnSinn', 'NeilStrauss', 'Mystery'];

async function cleanupDatabase() {
  try {
    // Existing cleanup logic
    const usersWithNullFirebaseUid = await User.find({ firebaseUid: null });
    console.log(`Found ${usersWithNullFirebaseUid.length} users with null firebaseUid`);

    const deleteResult = await User.deleteMany({ firebaseUid: null });
    console.log(`Deleted ${deleteResult.deletedCount} users with null firebaseUid`);

    const duplicates = await User.aggregate([
      { $group: { _id: "$firebaseUid", count: { $sum: 1 } } },
      { $match: { _id: { $ne: null }, count: { $gt: 1 } } }
    ]);

    console.log(`Found ${duplicates.length} duplicate firebaseUid values`);

    for (const dup of duplicates) {
      const users = await User.find({ firebaseUid: dup._id }).sort({ createdAt: 1 });
      for (let i = 1; i < users.length; i++) {
        await User.findByIdAndDelete(users[i]._id);
        console.log(`Deleted duplicate user with firebaseUid: ${dup._id}`);
      }
    }

    // Bot cleanup logic
    for (const botName of botFullNames) {
      const lowercaseName = botName.toLowerCase();
      
      // Find all users with this bot's name (case-insensitive)
      const users = await User.find({ 
        username: { $regex: new RegExp(`^${lowercaseName}$`, 'i') }
      });

      console.log(`Found ${users.length} users for bot ${botName}`);

      if (users.length >= 1) {
        // Keep the user with the exact botName or the first one if exact match not found
        const keepUser = users.find(u => u.username === botName) || users[0];
        
        // Delete all other users with similar names
        const deleteResult = await User.deleteMany({ 
          _id: { $ne: keepUser._id },
          username: { $regex: new RegExp(`^${lowercaseName}$`, 'i') }
        });
        
        console.log(`Deleted ${deleteResult.deletedCount} duplicate users for bot ${botName}`);
        
        // Update the kept user to ensure correct properties
        await User.findByIdAndUpdate(keepUser._id, { 
          username: botName,
          email: `${lowercaseName}@example.com`,
          isBot: true,
          firebaseUid: `bot_${lowercaseName}`
        });
        
        console.log(`Updated bot user ${botName}`);
      } else {
        // Create the bot user if it doesn't exist
        const newBot = new User({
          username: botName,
          email: `${lowercaseName}@example.com`,
          isBot: true,
          firebaseUid: `bot_${lowercaseName}`
        });
        await newBot.save();
        console.log(`Created new bot user ${botName}`);
      }
    }

    // Remove any remaining bot users not in the botFullNames list
    const invalidBots = await User.deleteMany({
      isBot: true,
      username: { $nin: botFullNames }
    });
    console.log(`Removed ${invalidBots.deletedCount} invalid bot users`);

    // Remove AustenSummers if it exists
    const austenSummersResult = await User.deleteOne({ username: 'AustenSummers' });
    if (austenSummersResult.deletedCount > 0) {
      console.log('Removed AustenSummers user');
    }

    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  }
}

async function verifyUsers() {
  const allUsers = await User.find({});
  console.log('All users after cleanup:');
  allUsers.forEach(user => {
    console.log(`Username: ${user.username}, Email: ${user.email}, IsBot: ${user.isBot}, FirebaseUID: ${user.firebaseUid}`);
  });
}

cleanupDatabase()
  .then(verifyUsers)
  .finally(() => {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  });