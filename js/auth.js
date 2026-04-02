import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const errorEl = document.getElementById("error");

function showError(message) {
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("show");
    // Scroll al mensaje de error
    errorEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function clearError() {
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("show");
  }
}

export async function login() {
  const email = document.getElementById("email")?.value?.trim();
  const password = document.getElementById("password")?.value;
  const loginBtn = document.getElementById("loginBtn");

  if (!email || !password) {
    showError("Por favor completa todos los campos");
    return;
  }

  if (!email.includes("@")) {
    showError("Ingresa un email válido");
    return;
  }

  if (password.length < 6) {
    showError("La contraseña debe tener al menos 6 caracteres");
    return;
  }

  try {
    clearError();
    if (loginBtn) loginBtn.disabled = true;
    
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "chat.html";
  } catch (err) {
    let message = "Error al iniciar sesión";
    
    if (err.code === "auth/user-not-found") {
      message = "❌ Usuario no encontrado";
    } else if (err.code === "auth/wrong-password") {
      message = "❌ Contraseña incorrecta";
    } else if (err.code === "auth/invalid-email") {
      message = "❌ Email inválido";
    } else if (err.code === "auth/invalid-credential") {
      message = "❌ Email o contraseña incorrectos";
    } else if (err.code === "auth/too-many-requests") {
      message = "❌ Demasiados intentos. Intenta más tarde";
    } else if (err.code === "auth/network-request-failed") {
      message = "❌ Error de conexión. Verifica tu internet";
    }
    
    showError(message);
    if (loginBtn) loginBtn.disabled = false;
  }
}

export function checkAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html";
    }
  });
}

export async function logout() {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (err) {
    console.error("Error al cerrar sesión:", err);
  }
}