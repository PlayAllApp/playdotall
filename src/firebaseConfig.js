import firebase from "firebase";

//firebase settings
const firebaseConfig = {
  apiKey: "AIzaSyDibjF6hkqRum3c0q4heUJL_OryoBcy3sI",
  authDomain: "playdotall.firebaseapp.com",
  databaseURL: "https://playdotall.firebaseio.com",
  projectId: "playdotall",
  storageBucket: "playdotall.appspot.com",
  messagingSenderId: "644125120691",
  appId: "1:644125120691:web:6e47f7c1e5bcaf854078c6",
  measurementId: "G-0ZTEF8X2KE",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

export default db;
