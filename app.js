document.addEventListener("DOMContentLoaded", () => {
  cargarLocales();
});

// Función inteligente para determinar si el local está abierto o cerrado usando la hora de Chile
function verificarEstadoLocal(horariosControl) {
  // 1. Forzar a obtener la fecha y hora exacta en la zona horaria de Chile (evita fallos de configuración local)
  const opciones = { timeZone: 'America/Santiago', hour12: false };
  const fechaChile = new Date(new Date().toLocaleString('en-US', opciones));
  
  const diaSemana = fechaChile.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const minutosActuales = (fechaChile.getHours() * 60) + fechaChile.getMinutes();

  let limitesHoy;
  let limitesAyer;

  // 2. Mapeo estricto de límites según el día de la semana en Chile
  if (diaSemana === 0) { // Domingo
    limitesHoy = horariosControl.domingo;
    limitesAyer = horariosControl.finDeSemana; // Ayer fue Sábado
  } else if (diaSemana === 1) { // Lunes
    limitesHoy = horariosControl.semana;
    limitesAyer = horariosControl.domingo; // Ayer fue Domingo
  } else if (diaSemana === 5 || diaSemana === 6) { // Viernes y Sábado
    limitesHoy = horariosControl.finDeSemana;
    limitesAyer = (diaSemana === 5) ? horariosControl.semana : horariosControl.finDeSemana;
  } else { // Martes, Miércoles, Jueves
    limitesHoy = horariosControl.semana;
    limitesAyer = horariosControl.semana;
  }

  // REGLA DE ORO: El local está CERRADO a menos que se demuestre lo contrario
  let abierto = false;

  // 3. CASO A: ¿Sigue abierto por la jornada nocturna que empezó ayer?
  if (limitesAyer.cierra > 1440) {
    const minutosLimiteAyer = limitesAyer.cierra - 1440; // minutos que se extienden en la madrugada de hoy
    if (minutosActuales < minutosLimiteAyer) {
      abierto = true;
    }
  }

  // 4. CASO B: Si no viene abierto de ayer, evaluar la jornada regular de HOY
  if (!abierto) {
    if (limitesHoy.cierra > 1440) {
      // Si hoy cierra de madrugada (ej: hasta la 01:00 AM), hoy solo abre hasta las 23:59
      if (minutosActuales >= limitesHoy.abre && minutosActuales < 1440) {
        abierto = true;
      }
    } else {
      // Horario normal que abre y cierra dentro del mismo día
      if (minutosActuales >= limitesHoy.abre && minutosActuales < limitesHoy.cierra) {
        abierto = true;
      }
    }
  }

  // 5. Retornar el badge dinámico según el resultado final
  if (abierto) {
    return `<span class="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Abierto
            </span>`;
  } else {
    return `<span class="bg-rose-500/10 text-rose-400 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shrink-0">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Cerrado
            </span>`;
  }
}

// Cargar y renderizar los locales en la cuadrícula principal
async function cargarLocales() {
  try {
    const respuesta = await fetch("data/localesJiren.json");
    if (!respuesta.ok) {
      throw new Error("No se pudo cargar el archivo de configuración de locales.");
    }
    const locales = await respuesta.json();
    
    const contenedor = document.getElementById("contenedor-locales");
    contenedor.innerHTML = "";

    locales.forEach(sucursal => {
      const badgeEstado = verificarEstadoLocal(sucursal.horarios_control);

      const tarjeta = document.createElement("div");
      tarjeta.className = "bg-slate-900/60 backdrop-blur-md rounded-2xl overflow-hidden border border-slate-900 hover:border-slate-800/80 transition-all duration-300 active:scale-[0.98] hover:scale-[1.02] cursor-pointer flex flex-col h-full shadow-lg hover:shadow-orange-500/5 group";
      
      tarjeta.onclick = () => seleccionarLocal(sucursal);

      tarjeta.innerHTML = `
        <div class="relative w-full aspect-[4/3] bg-slate-950/90 overflow-hidden flex items-center justify-center border-b border-slate-900/50">
          <img src="${sucursal.imagen}" alt="" class="absolute inset-0 w-full h-full object-cover blur-lg opacity-25 scale-125 pointer-events-none select-none">
          <div class="absolute inset-0 bg-slate-950/45 z-0"></div>
          <img 
            src="${sucursal.imagen}" 
            alt="${sucursal.nombre}" 
            class="relative z-10 w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          >
        </div>
        
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="text-lg md:text-xl font-bold text-white mb-2 tracking-tight group-hover:text-orange-500 transition-colors duration-300">
              ${sucursal.nombre}
            </h3>
            <p class="text-xs md:text-sm text-slate-400 flex items-center gap-2 mb-5">
              <i class="fa-solid fa-location-dot text-orange-500 text-sm shrink-0"></i> 
              <span class="truncate">${sucursal.direccion}</span>
            </p>
          </div>
          
          <div class="flex items-center justify-between text-xs pt-3 border-t border-slate-800/60">
            <span class="text-slate-400 flex items-center gap-1.5 max-w-[65%]">
              <i class="fa-regular fa-clock shrink-0"></i> 
              <span class="truncate" title="${sucursal.horario}">${sucursal.horario}</span>
            </span>
            ${badgeEstado}
          </div>
        </div>
      `;
      contenedor.appendChild(tarjeta);
    });
  } catch (error) {
    console.error("Error al renderizar los locales de Jiren Sushi:", error);
  }
}

// Lógica al seleccionar una sucursal (Muestra datos + Menú de platos)
function seleccionarLocal(sucursal) {
  const body = document.body;
  const contenedorLocales = document.getElementById("contenedor-locales");
  const seccionDetalle = document.getElementById("seccion-detalle");
  const header = document.querySelector("header");

  // Ocultamos la cuadricula y el header informativo inicial
  contenedorLocales.classList.add("hidden");
  header.classList.add("hidden");
  
  // Mostramos el contenedor de detalles
  seccionDetalle.classList.remove("hidden");

  // Efecto visual pro: Fondo dinámico usando la foto del local elegido
  body.style.backgroundImage = `linear-gradient(to bottom, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.99)), url('${sucursal.imagen}')`;
  body.style.backgroundSize = "cover";
  body.style.backgroundPosition = "center";
  body.style.backgroundAttachment = "fixed";

  // Volvemos a calcular el estado en tiempo real para el detalle
  const badgeEstadoDetalle = verificarEstadoLocal(sucursal.horarios_control);

  // Menú local de Jiren Sushi
  const menuProductos = [
    { nombre: "Jiren Roll", descripcion: "Salmón, queso crema y cebollín, envuelto en palta.", precio: "$6.200" },
    { nombre: "Avocado Roll", descripcion: "Camarón furai, queso crema y palta, envuelto en salmón.", precio: "$6.500" },
    { nombre: "Furai Hot Special", descripcion: "Pollo teriyaki, queso crema y cebollín, envuelto en panko frito.", precio: "$5.900" },
    { nombre: "Ebi Cheese Roll", descripcion: "Doble camarón, doble queso crema, envuelto en panko.", precio: "$6.800" },
    { nombre: "Vegetariano Green", descripcion: "Champignón, palmito, queso crema, envuelto en tempura de espinaca.", precio: "$5.500" },
    { nombre: "Gyozas de Cerdo", descripcion: "5 unidades de gyozas artesanales fritas al dente.", precio: "$3.800" }
  ];

  let productosHTML = "";
  menuProductos.forEach(prod => {
    productosHTML += `
      <div class="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center gap-4 transition-all hover:border-orange-500/30">
        <div class="text-left">
          <h4 class="text-white font-bold text-base md:text-lg">${prod.nombre}</h4>
          <p class="text-xs md:text-sm text-slate-400 mt-0.5">${prod.descripcion}</p>
        </div>
        <div class="text-right shrink-0">
          <span class="text-orange-500 font-extrabold text-base md:text-lg">${prod.precio}</span>
        </div>
      </div>
    `;
  });

  // Renderizado final (Incluye el botón de Volver integrado de forma hermosa en el detalle)
  seccionDetalle.innerHTML = `
    <!-- BOTÓN DE VOLVER INTEGRADO (Diseño sin Navbar) -->
    <div class="mb-6 text-left">
      <button onclick="volverAlSelector()" class="bg-slate-950 hover:bg-slate-900 text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs md:text-sm border border-slate-800 transition-all flex items-center gap-2 shadow-sm">
        <i class="fa-solid fa-arrow-left"></i> <span>Volver a Sucursales</span>
      </button>
    </div>

    <!-- HEADER DEL DETALLE -->
    <div class="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start mb-8 pb-6 border-b border-slate-800/60">
      <div class="w-full md:w-1/3 aspect-[4/3] rounded-2xl overflow-hidden relative bg-slate-950 flex items-center justify-center border border-slate-800 shadow-md shrink-0">
        <img src="${sucursal.imagen}" alt="" class="absolute inset-0 w-full h-full object-cover blur-md opacity-20 scale-110">
        <img src="${sucursal.imagen}" alt="${sucursal.nombre}" class="relative z-10 max-w-full max-h-full object-contain p-3">
      </div>
      
      <div class="flex-1 text-center md:text-left self-center">
        <div class="flex flex-col md:flex-row md:items-center gap-2 mb-2 justify-center md:justify-start">
          <span class="text-xs font-bold text-orange-500 tracking-widest uppercase">Sucursal Seleccionada</span>
          <div class="self-center md:self-auto">${badgeEstadoDetalle}</div>
        </div>
        <h2 class="text-2xl md:text-3.5xl font-black text-white mt-1 mb-3 tracking-tight">${sucursal.nombre}</h2>
        
        <div class="space-y-2">
          <p class="text-slate-300 text-sm md:text-base flex items-center justify-center md:justify-start gap-2">
            <i class="fa-solid fa-location-dot text-orange-500 text-sm"></i>
            <span>${sucursal.direccion}</span>
          </p>
          <p class="text-slate-400 text-xs md:text-sm flex items-center justify-center md:justify-start gap-2">
            <i class="fa-regular fa-clock text-slate-500 text-sm"></i>
            <span>Horarios: ${sucursal.horario}</span>
          </p>
        </div>
      </div>
    </div>
    
    <!-- SECCIÓN CARTA DE PLATOS -->
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-6 justify-center md:justify-start">
        <i class="fa-solid fa-utensils text-orange-500 text-lg"></i>
        <h3 class="text-xl font-bold text-white tracking-tight">Carta Destacada</h3>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${productosHTML}
      </div>
    </div>
    
    <!-- ACCIÓN COMERCIAL (WhatsApp) -->
    <div class="pt-6 border-t border-slate-800/80 text-center">
      <p class="text-slate-300 mb-4 text-sm md:text-base font-medium">
        ¿Listo para ordenar? Haz tu pedido directo al WhatsApp de esta sucursal:
      </p>
      
      <a 
        href="https://wa.me/569XXXXXXXX?text=Hola%20Jiren%20Sushi%20${encodeURIComponent(sucursal.nombre)},%20me%20gustar%C3%ADa%20hacer%20un%20pedido." 
        target="_blank" 
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-emerald-600/10 active:scale-95 text-sm md:text-base group"
      >
        <i class="fa-brands fa-whatsapp text-lg md:text-xl transition-transform group-hover:rotate-12"></i>
        <span>Pedir por WhatsApp</span>
      </a>
    </div>
  `;
}

// Volver al selector principal de locales
function volverAlSelector() {
  const body = document.body;
  const contenedorLocales = document.getElementById("contenedor-locales");
  const seccionDetalle = document.getElementById("seccion-detalle");
  const header = document.querySelector("header");

  // Invertimos las clases de visibilidad
  seccionDetalle.classList.add("hidden");
  contenedorLocales.classList.remove("hidden");
  header.classList.remove("hidden");

  // Quitamos el fondo dinámico de la sucursal
  body.style.backgroundImage = "";
}