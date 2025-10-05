import { createClient } from 'redis';
import fetch from 'node-fetch';

// Configuración de Redis (Upstash)
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Ubicaciones de sensores simulados (coordenadas de ciudades)
const sensores = [
  { id: 'sensor-1', nombre: 'Bogotá', lat: 4.6097, lon: -74.0817 },
  { id: 'sensor-2', nombre: 'Medellín', lat: 6.2442, lon: -75.5812 },
  { id: 'sensor-3', nombre: 'Cali', lat: 3.4516, lon: -76.5320 },
  { id: 'sensor-4', nombre: 'Barranquilla', lat: 10.9639, lon: -74.7964 },
  { id: 'sensor-5', nombre: 'Cartagena', lat: 10.3910, lon: -75.4794 }
];

// Función para obtener datos climáticos de Open-Meteo
async function obtenerDatosClimaticos(lat, lon) {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m`
    );
    
    const data = await response.json();
    
    return {
      temperatura: data.current.temperature_2m,
      humedad: data.current.relative_humidity_2m,
      presion: data.current.pressure_msl,
      viento: data.current.wind_speed_10m,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error obteniendo datos climáticos:', error);
    // Datos simulados en caso de error
    return {
      temperatura: Math.random() * 30 + 10,
      humedad: Math.random() * 50 + 30,
      presion: Math.random() * 50 + 1000,
      viento: Math.random() * 20,
      timestamp: new Date().toISOString()
    };
  }
}

// Función principal del publisher
async function iniciarPublisher() {
  try {
    await redisClient.connect();
    console.log('Publisher conectado a Redis');

    // Publicar datos cada 10 segundos
    setInterval(async () => {
      for (const sensor of sensores) {
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
        
        // Almacenar en Redis para histórico (máximo 100 registros por sensor)
        const clave = `clima:${sensor.id}`;
        await redisClient.lPush(clave, JSON.stringify(mensaje));
        await redisClient.lTrim(clave, 0, 99);
        
        console.log(`Datos publicados para ${sensor.nombre}:`, datosClima);
      }
    }, 10000); // Cada 10 segundos

  } catch (error) {
    console.error('Error en publisher:', error);
  }
}

iniciarPublisher();