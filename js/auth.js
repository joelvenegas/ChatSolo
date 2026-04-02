import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

export async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "chat.html";
  } catch (err) {
    document.getElementById("error").innerText = "Error al iniciar sesión";
  }
}

export function checkAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
    }
  });
}

export function logout() {
  signOut(auth);
  window.location.href = "index.html";
}