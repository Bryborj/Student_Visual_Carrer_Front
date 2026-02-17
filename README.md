# Visualizador Interactivo de Plan de Estudios (ICC)

Aplicación web desarrollada en **React.js** que permite visualizar un **plan de estudios universitario** como un **mapa conceptual interactivo**, donde el usuario puede marcar materias aprobadas y el sistema determina automáticamente cuáles puede cursar en el siguiente periodo, respetando prerrequisitos y reglas académicas.

---

## Descripción General

Este proyecto representa un **plan de estudios de Ingeniería en Ciencias de la Computación (ICC)** mediante un grafo visual organizado por semestres.
El objetivo principal es **ayudar al estudiante a planificar su trayectoria académica** de forma clara, visual y dinámica.

La aplicación funciona **100% en frontend**, sin necesidad de backend.

---

## Funcionalidades Principales

* Visualización del plan como **mapa conceptual**
* Marcar / desmarcar materias aprobadas
* Resaltado automático de materias disponibles
* Opacidad en materias bloqueadas por prerrequisitos
* Cálculo automático de créditos aprobados
* Persistencia del estado del usuario (localStorage)
* Modo oscuro con TailwindCSS
* Opción de impresión del mapa académico
* Diseño responsive

---

## Reglas Académicas Soportadas

* Prerrequisitos simples
* Prerrequisitos múltiples
* Reglas especiales (ej. **70% de créditos aprobados**)
* Validación automática en tiempo real

---

## Tecnologías Utilizadas

* **React.js** (Vite)
* **TailwindCSS**
* JavaScript (ES6+)
* HTML5 / CSS3
* LocalStorage (persistencia del lado del cliente)

---

## Estructura del Proyecto

```
src/
 ├─ data/
 │   └─ plan.json               # Plan de estudios
 ├─ logic/
 ├─ components/
 ├─ styles/             
 ├─ App.jsx
 └─ main.jsx
```

---

## Instalación y Ejecución

### Requisitos

* Node.js >= 18
* npm o yarn

### Pasos

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/visualizador-plan-estudios.git

# Entrar al proyecto
cd visualizador-plan-estudios

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

---

## Modo Oscuro

* Implementado con Tailwind (`dark:`)
* Preferencia guardada automáticamente
* Se restaura al recargar la página

---

## Impresión

La aplicación incluye un botón **“Imprimir Plan”** que:

* Ajusta colores para fondo blanco
* Oculta controles interactivos
* Imprime el mapa tal como el usuario lo visualiza

---

## Casos de Uso

* Planeación de carga académica
* Visualización de avance curricular
* Simulación de escenarios (“¿qué puedo cursar si apruebo X?”)
* Herramienta de apoyo para estudiantes y orientación académica

---

## Posibles Mejoras Futuras

* Exportación a PDF
* Guardado en backend
* Simulación de semestres
* Comparación entre planes de estudio
* Drag & drop de materias
* Autenticación de usuarios

---

## Autor

**Bryan A. Borges**
Est: Ingeniero en Ciencias de la Computación
Puebla 🇲🇽

---

## Licencia

Este proyecto se distribuye bajo la licencia **MIT**.
Puedes usarlo, modificarlo y adaptarlo libremente.
