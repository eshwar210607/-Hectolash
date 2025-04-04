// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-Etg27X80V_DlC_AsRbhKPmTnJfJOIQM",
  authDomain: "hectolash.firebaseapp.com",
  projectId: "hectolash",
  storageBucket: "hectolash.appspot.com", // Corrected storageBucket
  messagingSenderId: "712534964422",
  appId: "1:712534964422:web:7052fc30cbca6ca2f3ffc7",
  measurementId: "G-K8K0M8NQ1V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Function to display messages
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (messageDiv) {
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    setTimeout(() => {
      messageDiv.style.opacity = 0;
    }, 5000);
  } else {
    console.error(`Element with ID '${divId}' not found.`);
  }
}

// Event listener for sign-up
const signUp = document.getElementById('submitsignup');
signUp.addEventListener('click', (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const userName = document.getElementById('name').value; // Fixed ID

  const auth = getAuth();
  const db = getFirestore();

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      const userData = {
        email: email,
        userName: userName
      };

      showMessage('Account Created Successfully', 'signUpMessage');

      const docRef = doc(db, "users", user.uid);
      setDoc(docRef, userData)
        .then(() => {
          window.location.href = '/sources/html/login.html'; // Redirect to login page
        })
        .catch((error) => {
          console.error("Error writing document:", error);
        });
    })
    .catch((error) => {
      const errorCode = error.code;
      if (errorCode === 'auth/email-already-in-use') {
        showMessage('Email Address Already Exists !!!', 'signUpMessage');
      } else {
        showMessage('Unable to create user', 'signUpMessage');
      }
    });
});
