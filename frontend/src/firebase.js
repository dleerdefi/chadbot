// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA-V9d-gWnhYr11Qkl-Zf9TC2MzDI-D0ng",
  authDomain: "chadbot-login.firebaseapp.com",
  projectId: "chadbot-login",
  storageBucket: "chadbot-login.appspot.com",
  messagingSenderId: "941972847503",
  appId: "1:941972847503:web:bdce6b0b311726357829fa",
  measurementId: "G-Q9TTTHP375"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { auth };
export default app;