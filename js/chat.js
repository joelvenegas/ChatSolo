import { db, auth } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function enviarMensaje() {
  const input = document.getElementById("mensaje");
  const texto = input.value;

  if (!texto.trim()) return;

  await addDoc(collection(db, "mensajes"), {
    texto,
    user: auth.currentUser.email,
    timestamp: Date.now()
  });

  input.value = "";
}

export function escucharMensajes() {
  const contenedor = document.getElementById("mensajes");

  const q = query(collection(db, "mensajes"), orderBy("timestamp"));

  onSnapshot(q, (snapshot) => {
    contenedor.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();

      const div = document.createElement("div");
      div.classList.add("message");

      const timeString = new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

      if (data.user === auth.currentUser.email) {
        div.classList.add("me");
        div.innerHTML = `${data.texto}<br><small style="color: rgba(0,0,0,0.7);">${timeString}</small>`;
      } else {
        div.classList.add("other");
        div.innerHTML = `<strong style="color: #00ffff;">${data.user.split('@')[0]}:</strong> ${data.texto}<br><small style="color: #aaa;">${timeString}</small>`;
      }

      contenedor.appendChild(div);
    });

    // Auto scroll
    contenedor.scrollTop = contenedor.scrollHeight;
  });
}