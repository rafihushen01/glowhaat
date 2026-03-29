
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import{getAuth} from "firebase/auth"
const firebaseConfig = {
  apiKey: process.env.NEXT_FIREBASE_API_KEY,
  authDomain: "rafisworld-2748e.firebaseapp.com",
  projectId: "rafisworld-2748e",
  storageBucket: "rafisworld-2748e.firebasestorage.app",
  messagingSenderId: "14346084553",
  appId: "1:14346084553:web:29761c08a88f425e072d18",
  measurementId: "G-X0V7M0WT8S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const Auth =getAuth(app)
export {Auth,app}