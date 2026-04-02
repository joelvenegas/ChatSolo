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
      timestamp: Date.now(),
      type: "text"
    });

    input.value = "";
    input.focus();
  } catch (err) {
    console.error("Error al enviar mensaje:", err);
  }
}

export async function enviarImagen(file) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }

  // Limitar tamaño a 1MB para base64
  if (file.size > 1 * 1024 * 1024) {
    throw new Error("La imagen debe ser menor a 1MB");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Image = reader.result;

        // Guardar mensaje con imagen en base64
        await addDoc(collection(db, "mensajes"), {
          texto: "",
          imageData: base64Image,
          user: auth.currentUser.email,
          timestamp: Date.now(),
          type: "image"
        });

        resolve();
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };

    reader.readAsDataURL(file);
  });
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

        const isCurrentUser = data.user === auth.currentUser?.email;

        if (isCurrentUser) {
          div.classList.add("me");
        } else {
          div.classList.add("other");
        }

        // Mostrar contenido según tipo
        if (data.type === "image" && data.imageData) {
          div.innerHTML = `<img src="${data.imageData}" class="message-image" alt="Imagen compartida" loading="lazy"><small style="opacity: 0.7; font-size: 0.75em; display: block; margin-top: 0.5rem;">${timeString}</small>`;
        } else if (data.texto) {
          div.innerHTML = `<div>${escapeHtml(data.texto)}</div><small style="opacity: 0.7; font-size: 0.75em;">${timeString}</small>`;
        }

        messageContainer.appendChild(div);
      });

      // Auto scroll to latest message
      requestAnimationFrame(() => {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      });
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