const socket = io();

const mensajesDiv = document.getElementById("mensajes");
const input = document.getElementById("inputMsg");
const btn = document.getElementById("btnEnviar");

let miColor = "#000"; // color por defecto

// Enviar mensaje
btn.onclick = () => {
  const msg = input.value;
  if (msg.trim() !== "") {
    socket.emit("enviarMensaje", msg);
    input.value = "";
  }
};

// Recibo el color desde el servidor
socket.on("asignarColor", (color) => {
  miColor = color;
});

// Recibo mensajes desde Redis
socket.on("nuevoMensaje", (data) => {
  const { msg, color } = JSON.parse(data);
  const div = document.createElement("div");
  div.className = "msg";
  div.style.color = color;
  div.textContent = msg;
  mensajesDiv.appendChild(div);
  mensajesDiv.scrollTop = mensajesDiv.scrollHeight;
});