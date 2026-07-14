# Jiren Sushi - Selector Inteligente de Sucursales

Una plataforma web interactiva de una sola página (SPA) diseñada para la optimización en la selección de sucursales de la cadena de restaurantes Jiren Sushi en la Región de Valparaíso. El sistema automatiza la visualización de locales, la presentación de cartas de productos y la canalización de pedidos directamente hacia las API de comunicación correspondientes.

Nota: Este es un proyecto de desarrollo independiente con fines de portafolio y optimización de software. No constituye un sitio oficial gestionado por la marca.

---

## Características Técnicas Implementadas

* **Arquitectura de Una Sola Página (SPA):** Navegación fluida sin recargas de página mediante la manipulación dinámica del Document Object Model (DOM) con JavaScript puro.
* **Control Horario Centralizado en Tiempo Real:** Algoritmo que calcula de forma estricta el estado de apertura de cada sucursal basado en la zona horaria de Chile (America/Santiago), gestionando con precisión matemática las jornadas nocturnas que se extienden más allá de la medianoche.
* **Interfaz de Usuario Responsiva:** Diseño estructurado con Tailwind CSS bajo enfoque móvil-primero (Mobile-First), garantizando adaptabilidad completa desde dispositivos móviles hasta pantallas de escritorio.
* **Canalización Comercial Automatizada:** Enrutamiento dinámico hacia el servicio de mensajería instantánea de cada local, inyectando plantillas de texto parametrizadas con los datos específicos de la sucursal seleccionada.

---

## Arquitectura de Datos y Lógica de Tiempo

El principal desafío técnico resuelto fue la transición de validaciones basadas en cadenas de texto estáticas a una base de datos normalizada en minutos transcurridos desde la medianoche (Horas multiplicado por 60 más Minutos).

### Principio de Cerrado por Defecto
El sistema opera bajo un enfoque de seguridad lógica donde el estado inicial de toda sucursal se establece estrictamente como falso (Cerrado). La bandera cambia a verdadero (Abierto) únicamente si la hora del sistema en la zona horaria configurada cumple de forma exacta con los rangos numéricos de la jornada actual o la extensión de madrugada del día anterior.

---

## Estructura del Repositorio

```text
==================================================================================
jiren-sushi-web/
├── data/
│   └── localesJiren.json   # Base de datos local parametrizada en minutos
├── index.html              # Estructura semántica avanzada y layout corporativo
├── app.js                  # Motor de control horario y enrutamiento interno
└── README.md               # Documentación técnica del proyecto# JirenSushi-App.
==================================================================================
