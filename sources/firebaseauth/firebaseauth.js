 // Import the functions you need from the SDKs you need
 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
 import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js";
 // TODO: Add SDKs for Firebase products that you want to use
 // https://firebase.google.com/docs/web/setup#available-libraries

 // Your web app's Firebase configuration
 // For Firebase JS SDK v7.20.0 and later, measurementId is optional
 const firebaseConfig = {
   apiKey: "AIzaSyC-Etg27X80V_DlC_AsRbhKPmTnJfJOIQM",
   authDomain: "hectolash.firebaseapp.com",
   projectId: "hectolash",
   storageBucket: "hectolash.firebasestorage.app",
   messagingSenderId: "712534964422",
   appId: "1:712534964422:web:7052fc30cbca6ca2f3ffc7",
   measurementId: "G-K8K0M8NQ1V"
 };

 // Initialize Firebase
 const app = initializeApp(firebaseConfig);
 const analytics = getAnalytics(app);