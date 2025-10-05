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
  'Cartagena': '#FFEAA7',
  'Tunja': '#A29BFE',
  'Duitama': '#FD79A8',
  'Sogamoso': '#55EFC4',
  'Yopal': '#FDCB6E',
  'Aguazul': '#74B9FF'
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

// Destruir gráficos existentes
function destruirGraficos() {
  Object.keys(charts).forEach(tipo => {
    if (charts[tipo]) {
      charts[tipo].destroy();
      charts[tipo] = null;
    }
  });
  graficosListos = false;
  console.log('🗑️ Gráficos destruidos');
}

// Inicializar gráficos - VERSIÓN MEJORADA Y SIMPLIFICADA
function inicializarGraficos() {
  console.log('🔄 Iniciando inicialización de gráficos...');
  
  // Destruir gráficos existentes primero
  destruirGraficos();

  try {
    // Verificar que los elementos canvas existan
    const canvasIds = ['chartTemperatura', 'chartHumedad', 'chartPresion', 'chartViento'];
    let todosLosCanvasExisten = true;
    
    for (const canvasId of canvasIds) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error(`❌ No se encontró el canvas: ${canvasId}`);
        todosLosCanvasExisten = false;
        break;
      }
      console.log(`✅ Canvas encontrado: ${canvasId}`);
    }

    if (!todosLosCanvasExisten) {
      console.error('❌ No se pudieron encontrar todos los canvas');
      return false;
    }

    // Configuración base simplificada
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
            type: 'linear',
            position: 'bottom',
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

    // Crear datasets para cada sensor
    const datasets = Object.keys(coloresSensores).map(sensor => ({
      label: sensor,
      borderColor: coloresSensores[sensor],
      backgroundColor: coloresSensores[sensor] + '20',
      data: [],
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      fill: false
    }));

    // Inicializar gráficos individualmente
    try {
      charts.temperatura = new Chart(
        document.getElementById('chartTemperatura').getContext('2d'),
        {
          ...configBase,
          data: { datasets: JSON.parse(JSON.stringify(datasets)) }
        }
      );
      console.log('✅ Gráfico de temperatura inicializado');
    } catch (error) {
      console.error('❌ Error inicializando gráfico de temperatura:', error);
    }

    try {
      charts.humedad = new Chart(
        document.getElementById('chartHumedad').getContext('2d'),
        {
          ...configBase,
          data: { datasets: JSON.parse(JSON.stringify(datasets)) }
        }
      );
      console.log('✅ Gráfico de humedad inicializado');
    } catch (error) {
      console.error('❌ Error inicializando gráfico de humedad:', error);
    }

    try {
      charts.presion = new Chart(
        document.getElementById('chartPresion').getContext('2d'),
        {
          ...configBase,
          data: { datasets: JSON.parse(JSON.stringify(datasets)) }
        }
      );
      console.log('✅ Gráfico de presión inicializado');
    } catch (error) {
      console.error('❌ Error inicializando gráfico de presión:', error);
    }

    try {
      charts.viento = new Chart(
        document.getElementById('chartViento').getContext('2d'),
        {
          ...configBase,
          data: { datasets: JSON.parse(JSON.stringify(datasets)) }
        }
      );
      console.log('✅ Gráfico de viento inicializado');
    } catch (error) {
      console.error('❌ Error inicializando gráfico de viento:', error);
    }

    // Verificar que todos los gráficos se inicializaron
    const todosInicializados = Object.values(charts).every(chart => chart !== null);
    
    if (todosInicializados) {
      graficosListos = true;
      console.log('🎉 TODOS los gráficos inicializados correctamente');
      return true;
    } else {
      console.error('❌ No todos los gráficos se inicializaron');
      return false;
    }
  } catch (error) {
    console.error('❌ Error crítico inicializando gráficos:', error);
    return false;
  }
}

// Actualizar métricas actuales
function actualizarMetricas(datos) {
  datosCliente.metricasActuales[datos.sensorNombre] = datos;
  
  const metricasContainer = document.getElementById('metricasActuales');
  if (!metricasContainer) {
    console.error('❌ No se encontró el contenedor de métricas');
    return;
  }
  
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
  if (!graficosListos) {
    console.log('⏳ Gráficos no listos, reintentando inicialización...');
    if (inicializarGraficos()) {
      console.log('✅ Gráficos inicializados, procediendo con actualización');
    } else {
      console.error('❌ No se pudieron inicializar los gráficos');
      return;
    }
  }

  const timestamp = Date.now(); // Usar timestamp simple
  
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
        
        // Actualizar gráfico
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
  if (!heatmap) {
    console.error('❌ No se encontró el heatmap');
    return;
  }
  
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
  console.log('📊 Datos históricos recibidos');
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
  
  // Esperar un poco más para asegurar que todo esté renderizado
  setTimeout(() => {
    console.log('🎯 Intentando inicializar gráficos...');
    if (inicializarGraficos()) {
      console.log('🚀 Sistema IoT de monitoreo climático inicializado');
    } else {
      console.error('❌ Error crítico: No se pudieron inicializar los gráficos');
      // Reintentar después de 1 segundo
      setTimeout(() => {
        console.log('🔄 Reintentando inicialización de gráficos...');
        inicializarGraficos();
      }, 1000);
    }
  }, 1000);
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