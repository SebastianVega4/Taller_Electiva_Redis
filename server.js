import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Configuración mejorada de Redis
const redisConfig = {
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD,
  socket: {
    tls: true,
    rejectUnauthorized: false
  }
};

const publisher = createClient(redisConfig);
const subscriber = createClient(redisConfig);

// Manejo de errores de Redis
publisher.on('error', (err) => {
  console.error('Error en Redis Publisher:', err);
});

publisher.on('connect', () => {
  console.log('✅ Publisher conectado a Redis');
});

publisher.on('disconnect', () => {
  console.log('❌ Publisher desconectado de Redis');
});

subscriber.on('error', (err) => {
  console.error('Error en Redis Subscriber:', err);
});

subscriber.on('connect', () => {
  console.log('✅ Subscriber conectado a Redis');
});

subscriber.on('disconnect', () => {
  console.log('❌ Subscriber desconectado de Redis');
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
  try {
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
  } catch (error) {
    console.error('Error procesando datos climáticos:', error);
    return null;
  }
}

// Función para conectar a Redis con reintentos
async function conectarRedis() {
  try {
    await publisher.connect();
    await subscriber.connect();
    console.log("✅ Conectado a Redis exitosamente");
    return true;
  } catch (error) {
    console.error("❌ Error conectando a Redis:", error.message);
    return false;
  }
}

// Configurar Socket.IO
io.on("connection", (socket) => {
  console.log("🌐 Cliente conectado:", socket.id);

  // Enviar datos históricos al conectar
  socket.emit("datosHistoricos", datosClimaticos);

  socket.on("disconnect", () => {
    console.log("🌐 Cliente desconectado:", socket.id);
  });
});

// Iniciar servidor
async function iniciarServidor() {
  console.log("🔄 Intentando conectar a Redis...");
  
  const redisConectado = await conectarRedis();
  
  if (!redisConectado) {
    console.log("⚠️  Modo sin Redis: Los datos se procesarán localmente");
    
    // Simular datos si Redis no está disponible
    setInterval(() => {
      const datosSimulados = {
        sensorId: 'simulado-1',
        sensorNombre: 'Bogotá',
        temperatura: Math.random() * 10 + 15,
        humedad: Math.random() * 30 + 50,
        presion: Math.random() * 20 + 1000,
        viento: Math.random() * 10,
        timestamp: new Date().toISOString()
      };
      
      io.emit("nuevosDatosClima", datosSimulados);
    }, 10000);
    
  } else {
    // Suscribirse a canal de clima solo si Redis está conectado
    try {
      await subscriber.subscribe("canal-clima", (message) => {
        console.log('📨 Mensaje recibido de Redis');
        const datosProcesados = procesarDatosClimaticos(message);
        if (datosProcesados) {
          io.emit("nuevosDatosClima", datosProcesados);
        }
      });
      console.log("✅ Suscrito a canal-clima");
    } catch (error) {
      console.error("❌ Error suscribiéndose al canal:", error);
    }
  }

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor IoT ejecutándose en http://localhost:${PORT}`);
    console.log(`📊 Panel de monitoreo disponible`);
  });
}

// Manejo graceful de cierre
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  try {
    await publisher.quit();
    await subscriber.quit();
    console.log('✅ Conexiones Redis cerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cerrando conexiones:', error);
    process.exit(1);
  }
});

iniciarServidor();