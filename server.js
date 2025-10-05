import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Configuración de Redis (Upstash)
const publisher = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
const subscriber = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

app.use(express.static("public"));

// Almacenamiento de datos en memoria para gráficos
const datosClimaticos = {
  temperatura: [],
  humedad: [],
  presion: [],
  viento: []
};

// Función para procesar y almacenar datos
function procesarDatosClimaticos(mensaje) {
  const datos = JSON.parse(mensaje);
  
  // Agregar a los datos históricos (mantener últimos 50 registros)
  datosClimaticos.temperatura.push({
    sensor: datos.sensorNombre,
    valor: datos.temperatura,
    timestamp: datos.timestamp
  });
  
  datosClimaticos.humedad.push({
    sensor: datos.sensorNombre,
    valor: datos.humedad,
    timestamp: datos.timestamp
  });
  
  datosClimaticos.presion.push({
    sensor: datos.sensorNombre,
    valor: datos.presion,
    timestamp: datos.timestamp
  });
  
  datosClimaticos.viento.push({
    sensor: datos.sensorNombre,
    valor: datos.viento,
    timestamp: datos.timestamp
  });
  
  // Mantener solo los últimos 50 registros por tipo
  Object.keys(datosClimaticos).forEach(key => {
    if (datosClimaticos[key].length > 50) {
      datosClimaticos[key] = datosClimaticos[key].slice(-50);
    }
  });
  
  return datos;
}

// Conectar Redis y configurar WebSockets
async function iniciarServidor() {
  try {
    await publisher.connect();
    await subscriber.connect();
    
    console.log("Conectado a Redis");

    // Suscribirse a canal de clima
    await subscriber.subscribe("canal-clima", (message) => {
      const datosProcesados = procesarDatosClimaticos(message);
      io.emit("nuevosDatosClima", datosProcesados);
    });

    // Configurar Socket.IO
    io.on("connection", (socket) => {
      console.log("Cliente conectado:", socket.id);

      // Enviar datos históricos al conectar
      socket.emit("datosHistoricos", datosClimaticos);

      socket.on("disconnect", () => {
        console.log("Cliente desconectado:", socket.id);
      });
    });

    httpServer.listen(3000, () => {
      console.log("Servidor IoT en http://localhost:3000");
    });

  } catch (error) {
    console.error("Error iniciando servidor:", error);
  }
}

iniciarServidor();