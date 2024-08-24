const firebaseAdmin = require('firebase-admin');

const authenticateSocket = async (socket, next) => {
  console.log('Authenticating socket connection...');
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      console.log('No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    console.log('Verifying token...');
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
    console.log('Token verified successfully for user:', decodedToken.uid);
    socket.userId = decodedToken.uid;
    socket.user = decodedToken;  // Optionally store the full decoded token
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    next(new Error('Authentication error: ' + error.message));
  }
};

module.exports = authenticateSocket;