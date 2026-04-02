import { db } from "./firebase.js";
import { collection, addDoc, getDocs } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function enviarMensaje() {
  const texto = document.getElementById("mensaje").value;

  await addDoc(collection(db, "mensajes"), { texto });

  document.getElementById("mensaje").value = "";
  cargarMensajes();
}

export async function cargarMensajes() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "mensajes"));

  querySnapshot.forEach((doc) => {
    const li = document.createElement("li");
    li.textContent = doc.data().texto;
    lista.appendChild(li);
  });
}