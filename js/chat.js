import { db, auth } from "./firebase.js";
import { collection, addDoc, onSnapshot, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const messageContainer = document.getElementById("mensajes");

export async function enviarMensaje() {
  const input = document.getElementById("mensaje");
  if (!input) return;

  const texto = input.value.trim();

  if (!texto) {
    console.log("Texto vacío, no se envía");
    return;
  }

  try {
    // Validar que hay usuario autenticado
    if (!auth.currentUser) {
      throw new Error("No hay usuario autenticado");
    }

    console.log("Enviando mensaje:", { texto, user: auth.currentUser.email });

    await addDoc(collection(db, "mensajes"), {
      texto,
      user: auth.currentUser.email,
      timestamp: Date.now(),
      type: "text"
    });

    console.log("Mensaje guardado exitosamente");
    input.value = "";
    input.focus();
  } catch (err) {
    console.error("Error al enviar mensaje:", err);
    alert(`Error al enviar: ${err.message}`);
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

  // Limitar tamaño a 50MB
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`La imagen es muy grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo 50MB`);
  }

  try {
    console.log("Iniciando subida de imagen:", file.name);
    
    // Crear referencia única para la imagen
    const timestamp = Date.now();
    const fileName = `${auth.currentUser.uid}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `imagenes/${fileName}`);

    console.log("Subiendo archivo a:", fileName);
    // Subir archivo
    await uploadBytes(storageRef, file);

    console.log("Archivo subido, obteniendo URL...");
    // Obtener URL descargable
    const imageUrl = await getDownloadURL(storageRef);

    console.log("URL obtenida, guardando en Firestore...");
    // Guardar mensaje con URL de imagen
    await addDoc(collection(db, "mensajes"), {
      texto: "",
      imageUrl: imageUrl,
      user: auth.currentUser.email,
      timestamp: Date.now(),
      type: "image"
    });
    
    console.log("Imagen guardada exitosamente");
  } catch (err) {
    console.error("Error al subir imagen:", err);
    // Mensajes de error más específicos
    if (err.code === "storage/unauthorized") {
      throw new Error("No tienes permiso para subir imágenes. Verifica las reglas de Storage en Firebase");
    } else if (err.code === "storage/object-not-found") {
      throw new Error("Error: Bucket de storage no encontrado");
    } else if (err.code === "storage/bucket-not-found") {
      throw new Error("Error: Storage no está configurado correctamente");
    } else if (err.message?.includes("Failed to fetch")) {
      throw new Error("Error de conexión. Verifica tu internet");
    } else {
      throw new Error(`Error al subir: ${err.message || err.code || "Error desconocido"}`);
    }
  }
}

export function escucharMensajes() {
  if (!messageContainer) return;

  const q = query(collection(db, "mensajes"), orderBy("timestamp"));

  onSnapshot(
    q,
    (snapshot) => {
      console.log("Listener activado, documentos:", snapshot.size);
      messageContainer.innerHTML = "";

      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Procesando mensaje:", data);
        
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
        if (data.type === "image" && data.imageUrl) {
          div.innerHTML = `<img src="${data.imageUrl}" class="message-image" alt="Imagen compartida" loading="lazy"><small style="opacity: 0.7; font-size: 0.75em; display: block; margin-top: 0.5rem;">${timeString}</small>`;
        } else if (data.texto) {
          div.innerHTML = `<div>${escapeHtml(data.texto)}</div><small style="opacity: 0.7; font-size: 0.75em;">${timeString}</small>`;
        } else {
          // No mostrar si no tiene contenido
          console.log("Saltando mensaje sin contenido");
          return;
        }

        console.log("Agregando div al contenedor");
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