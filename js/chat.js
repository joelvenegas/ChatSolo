import { db, auth } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const messageContainer = document.getElementById("mensajes");

export async function enviarMensaje() {
  const input = document.getElementById("mensaje");
  if (!input) return;

  const texto = input.value.trim();

  if (!texto) return;

  try {
    await addDoc(collection(db, "mensajes"), {
      texto,
      user: auth.currentUser.email,
      timestamp: Date.now()
    });

    input.value = "";
    input.focus();
  } catch (err) {
    console.error("Error al enviar mensaje:", err);
  }
}

export function escucharMensajes() {
  if (!messageContainer) return;

  const q = query(collection(db, "mensajes"), orderBy("timestamp"));

  onSnapshot(
    q,
    (snapshot) => {
      messageContainer.innerHTML = "";

      snapshot.forEach((doc) => {
        const data = doc.data();
        const div = document.createElement("div");
        div.classList.add("message");

        const timeString = new Date(data.timestamp).toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit"
        });

        const userName = data.user.split("@")[0];
        const isCurrentUser = data.user === auth.currentUser?.email;

        if (isCurrentUser) {
          div.classList.add("me");
          div.innerHTML = `<div>${escapeHtml(data.texto)}</div><small style="opacity: 0.7; font-size: 0.75em;">${timeString}</small>`;
        } else {
          div.classList.add("other");
          div.innerHTML = `<div>${escapeHtml(data.texto)}</div><small style="opacity: 0.7; font-size: 0.75em;">${timeString}</small>`;
        }

        messageContainer.appendChild(div);
      });

      // Auto scroll to latest message
      messageContainer.scrollTop = messageContainer.scrollHeight;
    },
    (err) => {
      console.error("Error escuchando mensajes:", err);
    }
  );
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}