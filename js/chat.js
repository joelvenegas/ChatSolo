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

      if (data.user === auth.currentUser.email) {
        div.classList.add("me");
      } else {
        div.classList.add("other");
      }

      div.innerText = data.texto;

      contenedor.appendChild(div);
    });

    // Auto scroll
    contenedor.scrollTop = contenedor.scrollHeight;
  });
}