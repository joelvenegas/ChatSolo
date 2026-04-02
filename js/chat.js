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
  // Validar que sea archivo
  if (!file) {
    throw new Error("No se seleccionó ningún archivo");
  }

  // Validar tipo de archivo
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen (JPG, PNG, GIF, etc)");
  }

  // Comprimir imagen si es muy grande
  let fileToUse = file;
  const maxSize = 1 * 1024 * 1024;
  
  if (file.size > maxSize) {
    try {
      fileToUse = await comprimirImagen(file);
      if (fileToUse.size > maxSize) {
        throw new Error(`La imagen es muy grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo 1MB`);
      }
    } catch (err) {
      throw new Error(`Error al comprimir: ${err.message}`);
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          // Validar que se haya leído correctamente
          if (!reader.result) {
            throw new Error("No se pudo leer la imagen");
          }

          const base64Image = reader.result;

          // Validar que el base64 no esté vacío
          if (base64Image.length < 100) {
            throw new Error("La imagen está vacía o es muy pequeña");
          }

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

      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(new Error(`Error al leer el archivo: ${error.type || "Desconocido"}`));
      };

      reader.onabort = () => {
        reject(new Error("La lectura del archivo fue cancelada"));
      };

      // Leer el archivo como data URL
      reader.readAsDataURL(fileToUse);
    } catch (error) {
      reject(new Error(`Error al procesar la imagen: ${error.message}`));
    }
  });
}

// Función auxiliar para comprimir imágenes
function comprimirImagen(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Reducir tamaño si es muy grande
        const maxDimension = 1024;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir canvas a blob con compresión
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          "image/jpeg",
          0.7 // Calidad: 70%
        );
      };

      img.onerror = () => {
        reject(new Error("No se pudo procesar la imagen"));
      };

      img.src = event.target.result;
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