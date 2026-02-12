// Import necessary functions from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQbJVKDchfTYFQotVdBmCaYhlBE132xeE",
  authDomain: "cloudnet-cc351.firebaseapp.com",
  projectId: "cloudnet-cc351",
  storageBucket: "cloudnet-cc351.appspot.com",
  messagingSenderId: "84513993455",
  appId: "1:84513993455:web:01fa078a9e846bcc45a11a",
};

// Initialize Firebase app
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = getMessaging(firebaseApp);

// Export messaging instance
export default messaging;
