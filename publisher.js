import { createClient } from 'redis';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const redisConfig = {
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD
};

const redisClient = createClient(redisConfig);

// Manejo de errores
redisClient.on('error', (err) => {
  console.error('❌ Error Redis Publisher:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Publisher conectado a Redis');
});

// Ubicaciones de sensores simulados
const sensores = [
  { id: 'sensor-1', nombre: 'Bogotá', lat: 4.6097, lon: -74.0817 },
  { id: 'sensor-2', nombre: 'Medellín', lat: 6.2442, lon: -75.5812 },
  { id: 'sensor-3', nombre: 'Cali', lat: 3.4516, lon: -76.5320 },
  { id: 'sensor-4', nombre: 'Barranquilla', lat: 10.9639, lon: -74.7964 },
  { id: 'sensor-5', nombre: 'Cartagena', lat: 10.3910, lon: -75.4794 }
];

// Función para obtener datos climáticos
async function obtenerDatosClimaticos(lat, lon) {
  try {
    console.log(`🌤️  Obteniendo datos para ${lat}, ${lon}`);
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      temperatura: data.current.temperature_2m,
      humedad: data.current.relative_humidity_2m,
      presion: data.current.surface_pressure,
      viento: data.current.wind_speed_10m,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error obteniendo datos climáticos:', error.message);
    // Datos simulados en caso de error
    return {
      temperatura: Math.random() * 10 + 18,
      humedad: Math.random() * 30 + 50,
      presion: Math.random() * 20 + 1000,
      viento: Math.random() * 15,
      timestamp: new Date().toISOString()
    };
  }
}

// Función principal
async function iniciarPublisher() {
  try {
    console.log("🔄 Conectando Publisher a Redis...");
    await redisClient.connect();
    console.log('✅ Publisher conectado exitosamente');

    let ciclo = 0;
    
    // Publicar datos cada 15 segundos
    setInterval(async () => {
      ciclo++;
      console.log(`\n🔄 Ciclo ${ciclo}: Publicando datos...`);
      
      for (const sensor of sensores) {
        try {
          const datosClima = await obtenerDatosClimaticos(sensor.lat, sensor.lon);
          
          const mensaje = {
            sensorId: sensor.id,
            sensorNombre: sensor.nombre,
            lat: sensor.lat,
            lon: sensor.lon,
            ...datosClima
          };

          // Publicar en Redis
          await redisClient.publish('canal-clima', JSON.stringify(mensaje));
          
          console.log(`✅ ${sensor.nombre}: ${datosClima.temperatura}°C, ${datosClima.humedad}% humedad`);
          
          // Pequeña pausa entre sensores
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`❌ Error procesando sensor ${sensor.nombre}:`, error.message);
        }
      }
      
      console.log(`✅ Ciclo ${ciclo} completado`);
      
    }, 15000); // Cada 15 segundos

  } catch (error) {
    console.error('❌ Error crítico en publisher:', error);
    process.exit(1);
  }
}

// Manejo graceful de cierre
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando publisher...');
  try {
    await redisClient.quit();
    console.log('✅ Publisher cerrado correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cerrando publisher:', error);
    process.exit(1);
  }
});

iniciarPublisher();