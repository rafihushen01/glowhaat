// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"


const firebaseConfig = {
  apiKey: "AIzaSyDoss9uSi6b2vlY2qJxo_3KoH32VLtNfQo",
  authDomain: "khancosmetics.firebaseapp.com",
  projectId: "khancosmetics",
  storageBucket: "khancosmetics.firebasestorage.app",
  messagingSenderId: "790149938468",
  appId: "1:790149938468:web:f65fd1e4d074e9bd5547b1",
  measurementId: "G-YLDC01S101"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const Auth=getAuth(app)
export {app,Auth}