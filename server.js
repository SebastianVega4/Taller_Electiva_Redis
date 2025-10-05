import express from "express"; // permitir crear servidor web
import { createServer } from "http"; // crear servidor HTTP
import { Server } from "socket.io"; // Esta librería permite comunicación en tiempo real haciendo uso de WebSockets que es un protocolo que permite comunicación bidireccional entre cliente y servidor
import { createClient } from "redis"; // cliente de Redis

const app = express(); // crear aplicación Express
const httpServer = createServer(app); // crear servidor HTTP
const io = new Server(httpServer); // crear servidor Socket.IO

// Servir archivos estáticos desde la carpeta "public"

app.use(express.static("public"));

// Conectar Redis
const publisher = createClient(); // cliente de Redis para publicar mensajes
const subscriber = createClient(); // cliente de Redis para suscribirse a mensajes

await publisher.connect(); // conectar cliente de Redis para publicar mensajes además contiene la palabra await porque es una operación asíncrona
await subscriber.connect(); // conectar cliente de Redis para suscribirse a mensajes

// Suscribirse a canal de Redis
await subscriber.subscribe("canal_chat", (message) => { // suscribirse al canal "canal_chat" de Redis
  io.emit("nuevoMensaje", message); // emitir mensaje a todos los clientes conectados a través de Socket.IO
}); // cuando se recibe un mensaje en el canal "canal_chat", se emite a todos los clientes conectados a través de Socket.IO

// Socket.IO recibir mensajes desde el cliente y publicar en Redis
io.on("connection", (socket) => { // cuando un cliente se conecta
  console.log("Un usuario conectado:", socket.id);

  // Generar un color aleatorio para el usuario
  const colores = ["#1976d2", "#388e3c", "#d32f2f", "#f57c00", "#7b1fa2", "#c2185b", "#00796b", "#512da8", "#303f9f"];
  const color = colores[Math.floor(Math.random() * colores.length)];

  // Enviar al cliente su color
  socket.emit("asignarColor", color);

  socket.on("enviarMensaje", async (msg) => { // cuando se recibe un mensaje del cliente
    // Publicar mensaje en Redis
    await publisher.publish("canal_chat", JSON.stringify({ msg, color })); // publicar mensaje en el canal "canal_chat" de Redis
  });
});

httpServer.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
}); 