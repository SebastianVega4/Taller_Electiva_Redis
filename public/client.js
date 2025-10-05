const socket = io();

// Configuración de gráficos
const charts = {
  temperatura: null,
  humedad: null,
  presion: null,
  viento: null
};

// Colores para diferentes sensores
const coloresSensores = {
  'Bogotá': '#FF6B6B',
  'Medellín': '#4ECDC4',
  'Cali': '#45B7D1',
  'Barranquilla': '#96CEB4',
  'Cartagena': '#FFEAA7'
};

// Datos en memoria del cliente
const datosCliente = {
  metricasActuales: {},
  historico: {
    temperatura: [],
    humedad: [],
    presion: [],
    viento: []
  }
};

// Bandera para verificar si los gráficos están listos
let graficosListos = false;
let inicializacionEnProgreso = false;

// Destruir gráficos existentes
function destruirGraficos() {
  Object.keys(charts).forEach(tipo => {
    if (charts[tipo]) {
      charts[tipo].destroy();
      charts[tipo] = null;
    }
  });
  graficosListos = false;
}

// Inicializar gráficos - VERSIÓN CORREGIDA
function inicializarGraficos() {
  if (inicializacionEnProgreso) {
    console.log('🔄 Inicialización ya en progreso...');
    return false;
  }
  
  inicializacionEnProgreso = true;
  
  try {
    // Destruir gráficos existentes primero
    destruirGraficos();

    // Verificar que los elementos canvas existan
    const canvasIds = ['chartTemperatura', 'chartHumedad', 'chartPresion', 'chartViento'];
    
    for (const canvasId of canvasIds) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error(`❌ No se encontró el canvas: ${canvasId}`);
        inicializacionEnProgreso = false;
        return false;
      }
      // Limpiar el contexto del canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const configBase = {
      type: 'line',
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm'
              }
            },
            title: {
              display: true,
              text: 'Tiempo'
            }
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Valor'
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    };

    // Inicializar gráficos con IDs únicos
    charts.temperatura = new Chart(
      document.getElementById('chartTemperatura').getContext('2d'),
      {
        ...configBase,
        data: {
          datasets: Object.keys(coloresSensores).map(sensor => ({
            label: sensor,
            borderColor: coloresSensores[sensor],
            backgroundColor: coloresSensores[sensor] + '20',
            data: [],
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false
          }))
        }
      }
    );

    charts.humedad = new Chart(
      document.getElementById('chartHumedad').getContext('2d'),
      {
        ...configBase,
        data: {
          datasets: Object.keys(coloresSensores).map(sensor => ({
            label: sensor,
            borderColor: coloresSensores[sensor],
            backgroundColor: coloresSensores[sensor] + '20',
            data: [],
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false
          }))
        }
      }
    );

    charts.presion = new Chart(
      document.getElementById('chartPresion').getContext('2d'),
      {
        ...configBase,
        data: {
          datasets: Object.keys(coloresSensores).map(sensor => ({
            label: sensor,
            borderColor: coloresSensores[sensor],
            backgroundColor: coloresSensores[sensor] + '20',
            data: [],
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false
          }))
        }
      }
    );

    charts.viento = new Chart(
      document.getElementById('chartViento').getContext('2d'),
      {
        ...configBase,
        data: {
          datasets: Object.keys(coloresSensores).map(sensor => ({
            label: sensor,
            borderColor: coloresSensores[sensor],
            backgroundColor: coloresSensores[sensor] + '20',
            data: [],
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false
          }))
        }
      }
    );

    graficosListos = true;
    inicializacionEnProgreso = false;
    console.log('✅ Gráficos inicializados correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error inicializando gráficos:', error);
    destruirGraficos();
    inicializacionEnProgreso = false;
    return false;
  }
}

// Actualizar métricas actuales
function actualizarMetricas(datos) {
  datosCliente.metricasActuales[datos.sensorNombre] = datos;
  
  const metricasContainer = document.getElementById('metricasActuales');
  metricasContainer.innerHTML = '';
  
  Object.values(datosCliente.metricasActuales).forEach(metricas => {
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.style.background = `linear-gradient(135deg, ${coloresSensores[metricas.sensorNombre]} 0%, ${ajustarColor(coloresSensores[metricas.sensorNombre], -30)} 100%)`;
    
    card.innerHTML = `
      <h4>${metricas.sensorNombre}</h4>
      <div class="metric-value">${metricas.temperatura.toFixed(1)}°C</div>
      <div class="metric-sensor">
        Hum: ${metricas.humedad}% | Pres: ${metricas.presion.toFixed(1)} hPa<br>
        Viento: ${metricas.viento.toFixed(1)} km/h
      </div>
    `;
    
    metricasContainer.appendChild(card);
  });
}

// Función auxiliar para ajustar colores
function ajustarColor(color, cantidad) {
  // Convertir color HEX a RGB
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);

  // Ajustar brillo
  r = Math.max(0, Math.min(255, r + cantidad));
  g = Math.max(0, Math.min(255, g + cantidad));
  b = Math.max(0, Math.min(255, b + cantidad));

  // Convertir de vuelta a HEX
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Actualizar gráficos - VERSIÓN MEJORADA
function actualizarGraficos(datos) {
  // Si los gráficos no están listos, no intentar actualizar
  if (!graficosListos) {
    console.log('⏳ Gráficos no listos, esperando inicialización...');
    return;
  }

  const timestamp = new Date(datos.timestamp);
  
  // Actualizar cada gráfico con manejo de errores
  Object.keys(charts).forEach(tipo => {
    try {
      const chart = charts[tipo];
      
      if (!chart) {
        console.warn(`⚠️ Gráfico ${tipo} no está inicializado`);
        return;
      }
      
      const datasetIndex = chart.data.datasets.findIndex(ds => ds.label === datos.sensorNombre);
      
      if (datasetIndex !== -1) {
        // Agregar nuevo punto
        const valor = datos[tipo === 'viento' ? 'viento' : tipo];
        chart.data.datasets[datasetIndex].data.push({
          x: timestamp,
          y: valor
        });
        
        // Mantener últimos 20 puntos
        if (chart.data.datasets[datasetIndex].data.length > 20) {
          chart.data.datasets[datasetIndex].data.shift();
        }
        
        // Actualizar gráfico suavemente
        chart.update('none');
      }
    } catch (error) {
      console.error(`❌ Error actualizando gráfico ${tipo}:`, error);
    }
  });
}

// Actualizar mapa de calor
function actualizarHeatmap() {
  const heatmap = document.getElementById('heatmap');
  heatmap.innerHTML = '';
  
  Object.values(datosCliente.metricasActuales).forEach(datos => {
    const item = document.createElement('div');
    item.className = 'heatmap-item';
    
    // Calcular color basado en temperatura
    const temp = datos.temperatura;
    let color;
    if (temp < 15) color = '#4ECDC4'; // Frío
    else if (temp < 25) color = '#FFEAA7'; // Templado
    else color = '#FF6B6B'; // Caliente
    
    item.style.background = `linear-gradient(135deg, ${color} 0%, ${ajustarColor(color, -20)} 100%)`;
    
    item.innerHTML = `
      <div class="sensor-name">${datos.sensorNombre}</div>
      <div class="temp-value">${temp.toFixed(1)}°C</div>
    `;
    
    heatmap.appendChild(item);
  });
}

// Eventos de Socket.IO - VERSIÓN MEJORADA
socket.on('datosHistoricos', (datos) => {
  console.log('📊 Datos históricos recibidos');
  // Aquí puedes procesar datos históricos si es necesario
});

socket.on('nuevosDatosClima', (datos) => {
  console.log('📨 Nuevos datos climáticos:', datos.sensorNombre);
  
  actualizarMetricas(datos);
  actualizarGraficos(datos);
  actualizarHeatmap();
});

// Manejar errores de conexión
socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión:', error);
});

// Inicializar la aplicación cuando el DOM esté completamente listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 Inicializando aplicación IoT...');
  
  // Esperar a que todos los elementos estén renderizados
  setTimeout(() => {
    if (inicializarGraficos()) {
      console.log('🚀 Sistema IoT de monitoreo climático inicializado');
    } else {
      console.error('❌ Error crítico: No se pudieron inicializar los gráficos');
      // Reintentar después de 2 segundos
      setTimeout(() => {
        console.log('🔄 Reintentando inicialización de gráficos...');
        inicializarGraficos();
      }, 2000);
    }
  }, 500);
});

// Manejar reconexiones de Socket.IO
socket.on('connect', () => {
  console.log('✅ Conectado al servidor');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado del servidor');
});

// Manejar cierre de la página
window.addEventListener('beforeunload', () => {
  destruirGraficos();
});