const path = require('path');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');
const axios = require('axios');
const firebaseAdmin = require('firebase-admin');
const User = require('./models/User');
const Message = require('./models/Message');
const bots = require('./bots');
const upload = require('./uploadConfig');
const isAdmin = require('./middleware/isAdmin');
const config = require('./config');
require('dotenv').config({ path: './keys.env' });

const app = express();

app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' 'unsafe-inline' https://apis.google.com; frame-src 'self' https://accounts.google.com;"
  );
  next();
});

app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
}));

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

const serviceAccount = require('./serviceAccountKey.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = (email, verificationLink) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Email Verification',
    text: `Click the link to verify your email: ${verificationLink}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

const authenticateFirebaseToken = async (req, res, next) => {
    console.log('Authenticating Firebase token');
    const { authorization } = req.headers;
  
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
  
    const token = authorization.split('Bearer ')[1];
  
    try {
      console.log('Verifying token...');
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      console.log('Token verified successfully');
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid token', details: error.message });
    }
};

app.post('/register', async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const userRecord = await firebaseAdmin.auth().createUser({
      email,
      password,
      emailVerified: false,
    });

    const newUser = new User({ email, username, firebaseUid: userRecord.uid });
    await newUser.save();

    const verificationLink = await firebaseAdmin.auth().generateEmailVerificationLink(email);
    sendVerificationEmail(email, verificationLink);

    res.status(201).json({ message: 'User registered. Please check your email to verify your account.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Error registering user', details: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error logging in', details: error.message });
  }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out, please try again' });
        }
        res.redirect('/');
    });
});

app.get('/', (req, res) => {
    res.send('Welcome to the Chatbot Application');
});

app.get('/api/users', authenticateFirebaseToken, async (req, res) => {
    try {
        const users = await User.find({}, 'username profilePic bio');
        res.json(users.map(user => ({
            name: user.username,
            profilePic: user.profilePic,
            bio: user.bio
        })));
    } catch (err) {
        res.status(500).json({ error: 'Error fetching users', details: err.message });
    }
});

// Add a new endpoint for all users (including _id)
app.get('/api/all-users', authenticateFirebaseToken, async (req, res) => {
    try {
        const users = await User.find({}, '_id username profilePic bio');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});

app.get('/api/bots', (req, res) => {
    res.json(bots.map(bot => ({
        name: bot.username,
        profilePic: bot.profilePic || '/default-bot-avatar.png',
        bio: bot.bio || 'I am a chatbot.'
    })));
});

app.get('/api/messages', authenticateFirebaseToken, async (req, res) => {
    console.log('Received request for messages');
    try {
        console.log('Fetching messages from database...');
        const messages = await Message.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('user', 'username profilePic');
        console.log(`Found ${messages.length} messages`);
        res.json(messages.map(message => ({
            id: message._id,
            text: message.text,
            user: {
                name: message.user ? message.user.username : 'Unknown User',
                profilePic: message.user ? message.user.profilePic : '/default-avatar.png'
            },
            createdAt: message.createdAt
        })));
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }
});

app.get('/api/current_user', authenticateFirebaseToken, async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });
    if (user) {
      if (!user.username) {
        user.username = `User_${user._id.toString().slice(-5)}`;
        await user.save();
      }
      res.json(user);
    } else {
      user = new User({
        email: req.user.email,
        firebaseUid: req.user.uid,
        username: `User_${new mongoose.Types.ObjectId().toString().slice(-5)}`
      });
      await user.save();
      res.json(user);
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user', details: error.message });
  }
});

app.post('/api/update-profile', authenticateFirebaseToken, async (req, res) => {
  const { username, bio } = req.body;
  try {
    console.log('Received update request:', req.body);
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { username, bio },
      { new: true }
    );
    if (user) {
      console.log('Updated user:', user);
      res.json({ message: 'Profile updated successfully', user });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Error updating profile', details: error.message });
  }
});

app.post('/api/upload-profile-pic', authenticateFirebaseToken, upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { profilePic: `/uploads/${req.file.filename}` },
      { new: true }
    );
    if (user) {
      res.json({ message: 'Profile picture uploaded successfully', profilePicUrl: user.profilePic });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Error uploading profile picture', details: error.message });
  }
});

const getBotResponse = async (botName, prompt) => {
    try {
        const bot = bots.find(b => b.username.toLowerCase() === botName.toLowerCase());
        if (!bot) {
            throw new Error('Bot not found');
        }

        console.log(`Generating response for ${botName} with prompt: ${prompt}`);
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4",
            messages: [
                { role: "system", content: bot.personality },
                { role: "user", content: prompt }
            ],
            max_tokens: 150,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            }
        });

        console.log('Bot response:', response.data.choices[0].message.content.trim());
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error generating bot response:', error.response ? error.response.data : error.message);
        return 'Sorry, I am unable to respond at the moment.';
    }
};

// In the POST route for messages
app.post('/api/messages', authenticateFirebaseToken, async (req, res) => {
    const { text } = req.body;
    console.log('Received message:', text);
    try {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const message = new Message({
            user: user._id,
            text: text
        });
        
        await message.save();

        const botName = bots.find(bot => text.toLowerCase().includes(`@${bot.username.toLowerCase()}`))?.username;
        console.log('Detected bot:', botName);

        if (botName) {
            console.log(`Message directed at bot: ${botName}`);
            const botPrompt = text.replace(new RegExp(`@${botName}`, 'i'), '').trim();
            console.log('Bot prompt:', botPrompt);
            const botResponse = await getBotResponse(botName, botPrompt);
            console.log('Bot response:', botResponse);

            // Find or create bot user
            let botUser = await User.findOne({ username: botName });
            if (!botUser) {
                botUser = new User({
                    username: botName,
                    email: `${botName.toLowerCase()}@example.com`,
                    isBot: true
                });
                await botUser.save();
            }

            const botMessage = new Message({ user: botUser._id, text: botResponse });
            await botMessage.save();
            
            res.json([
                {
                    id: message._id,
                    text: message.text,
                    user: { name: user.username, profilePic: user.profilePic },
                    createdAt: message.createdAt
                },
                {
                    id: botMessage._id,
                    text: botMessage.text,
                    user: { name: botUser.username, profilePic: '/default-bot-avatar.png' },
                    createdAt: botMessage.createdAt
                }
            ]);
        } else {
            res.json([{
                id: message._id,
                text: message.text,
                user: { name: user.username, profilePic: user.profilePic },
                createdAt: message.createdAt
            }]);
        }
    } catch (error) {
        console.error('Error posting message:', error);
        res.status(500).json({ error: 'Error posting message', details: error.message });
    }
});

// In the GET route for messages
app.get('/api/messages', authenticateFirebaseToken, async (req, res) => {
    console.log('Received request for messages');
    try {
        console.log('Fetching messages from database...');
        const messages = await Message.find()
            .sort({ createdAt: 1 }) // Sort by creation time, oldest first
            .limit(100) // Limit to last 100 messages
            .populate('user', 'username profilePic');
        console.log(`Found ${messages.length} messages`);
        res.json(messages.map(message => ({
            id: message._id,
            text: message.text,
            user: {
                name: message.user ? message.user.username : 'Unknown User',
                profilePic: message.user ? message.user.profilePic : '/default-avatar.png'
            },
            createdAt: message.createdAt // Send the creation time back to the client
        })));
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }
});

// Make user an admin
app.post('/api/make-admin', authenticateFirebaseToken, isAdmin, async (req, res) => {
    const { userId } = req.body;
    try {
      const user = await User.findByIdAndUpdate(userId, { isAdmin: true }, { new: true });
      res.json({ message: 'User is now an admin', user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user', details: error.message });
    }
  });
  
  // Ban a user
  app.post('/api/ban-user', authenticateFirebaseToken, isAdmin, async (req, res) => {
    const { userId } = req.body;
    try {
      const user = await User.findByIdAndUpdate(userId, { isBanned: true }, { new: true });
      res.json({ message: 'User has been banned', user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to ban user', details: error.message });
    }
  });
  
  // Get all users (admin only)
  app.get('/api/all-users', authenticateFirebaseToken, isAdmin, async (req, res) => {
    try {
      const users = await User.find({}, '-password');
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
  });
  
  // Delete messages (admin only)
  app.post('/api/delete-messages', authenticateFirebaseToken, isAdmin, async (req, res) => {
    const { messageIds } = req.body;
    
    try {
      await Message.deleteMany({ _id: { $in: messageIds } });
      res.json({ message: 'Messages deleted successfully' });
    } catch (error) {
      console.error('Error deleting messages:', error);
      res.status(500).json({ error: 'Error deleting messages', details: error.message });
    }
  });

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});