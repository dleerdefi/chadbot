const admin = require("firebase-admin");

let firebaseAdminInitialized = false;

const setupFirebase = () => {
	if (!firebaseAdminInitialized) {
		const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
		if (serviceAccount) {
			admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
			});
			console.log("Firebase initialized successfully");
			firebaseAdminInitialized = true;
		} else {
			console.warn("Firebase Admin SDK is not configured. Some features may not work.");
		}
	}
};

module.exports = { admin, setupFirebase };
