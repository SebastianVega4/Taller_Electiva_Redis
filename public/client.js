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

// Inicializar gráficos
function inicializarGraficos() {
  const configBase = {
    type: 'line',
    options: {
      responsive: true,
      animation: {
        duration: 0
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute'
          }
        },
        y: {
          beginAtZero: false
        }
      }
    }
  };

  // Gráfico de temperatura
  charts.temperatura = new Chart(
    document.getElementById('chartTemperatura'),
    {
      ...configBase,
      data: {
        datasets: Object.keys(coloresSensores).map(sensor => ({
          label: sensor,
          borderColor: coloresSensores[sensor],
          backgroundColor: coloresSensores[sensor] + '20',
          data: [],
          tension: 0.4
        }))
      }
    }
  );

  // Gráfico de humedad
  charts.humedad = new Chart(
    document.getElementById('chartHumedad'),
    {
      ...configBase,
      data: {
        datasets: Object.keys(coloresSensores).map(sensor => ({
          label: sensor,
          borderColor: coloresSensores[sensor],
          backgroundColor: coloresSensores[sensor] + '20',
          data: [],
          tension: 0.4
        }))
      }
    }
  );

  // Gráfico de presión
  charts.presion = new Chart(
    document.getElementById('chartPresion'),
    {
      ...configBase,
      data: {
        datasets: Object.keys(coloresSensores).map(sensor => ({
          label: sensor,
          borderColor: coloresSensores[sensor],
          backgroundColor: coloresSensores[sensor] + '20',
          data: [],
          tension: 0.4
        }))
      }
    }
  );

  // Gráfico de viento
  charts.viento = new Chart(
    document.getElementById('chartViento'),
    {
      ...configBase,
      data: {
        datasets: Object.keys(coloresSensores).map(sensor => ({
          label: sensor,
          borderColor: coloresSensores[sensor],
          backgroundColor: coloresSensores[sensor] + '20',
          data: [],
          tension: 0.4
        }))
      }
    }
  );
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

// Actualizar gráficos
function actualizarGraficos(datos) {
  const timestamp = new Date(datos.timestamp);
  
  // Actualizar cada gráfico
  Object.keys(charts).forEach(tipo => {
    const chart = charts[tipo];
    const datasetIndex = chart.data.datasets.findIndex(ds => ds.label === datos.sensorNombre);
    
    if (datasetIndex !== -1) {
      // Agregar nuevo punto
      chart.data.datasets[datasetIndex].data.push({
        x: timestamp,
        y: datos[tipo === 'viento' ? 'viento' : tipo]
      });
      
      // Mantener últimos 20 puntos
      if (chart.data.datasets[datasetIndex].data.length > 20) {
        chart.data.datasets[datasetIndex].data.shift();
      }
      
      chart.update('none');
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

// Eventos de Socket.IO
socket.on('datosHistoricos', (datos) => {
  console.log('Datos históricos recibidos');
  // Procesar datos históricos si es necesario
});

socket.on('nuevosDatosClima', (datos) => {
  console.log('Nuevos datos climáticos:', datos);
  
  actualizarMetricas(datos);
  actualizarGraficos(datos);
  actualizarHeatmap();
});

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  inicializarGraficos();
  console.log('Sistema IoT de monitoreo climático inicializado');
});