# Student Visual Carrer - Frontend 🐺

Aplicación web desarrollada en **React 19 + TypeScript + Vite + Tailwind CSS 4** para la visualización interactiva de mapas curriculares universitarios BUAP, foro comunitario y gobernanza estudiantil con votación en tiempo real.

Este repositorio corresponde exclusivamente al **Frontend**. El backend complementario se encuentra en [Student_Visual_Carrer_Back](https://github.com/Bryborj/Student_Visual_Carrer_Back).

---

## 🎯 Arquitectura del Proyecto

```
Student_Visual_Carrer_Front/
├── src/
│   ├── components/
│   │   ├── StudentPlanEditor.tsx  # Panel de actualización de planes y votación comunitaria
│   │   ├── AdminDashboard.jsx     # Moderación de propuestas y administración
│   │   ├── ForumPage.tsx          # Foro institucional de discusión
│   │   ├── ClusterColumn.jsx      # Renderizado de periodos/bloques curriculares
│   │   ├── SubjectNode.jsx        # Nodos interactivos de materias y prerrequisitos
│   │   └── WelcomeScreen.jsx      # Pantalla principal y selector de recursos
│   ├── hooks/
│   │   ├── useStudyPlan.js        # Lógica de cálculo de créditos y prerrequisitos
│   │   └── useRouter.tsx          # Enrutamiento SPA ligero
│   ├── App.jsx                    # Orquestador de vistas (/visualizador, /foro, /propuestas, /admin)
│   └── index.css                  # Tailwind CSS 4 y estilos globales
├── vite.config.js                 # Proxy local automático a http://localhost:8001
├── Dockerfile                     # Nginx multi-stage build para producción
├── docker-compose.yml             # Despliegue en contenedor (puerto 5400)
└── package.json                   # Dependencias frontend (React 19, Tailwind 4)
```

---

## 🚀 Inicio Rápido para Desarrollo

### Requisitos
- Node.js >= 20
- pnpm >= 9 (o npm)
- Backend activo en `http://localhost:8001` (Ver [Student_Visual_Carrer_Back](https://github.com/Bryborj/Student_Visual_Carrer_Back))

### Pasos
1. **Instalar dependencias:**
   ```bash
   pnpm install
   ```
2. **Configurar variables de entorno (opcional):**
   ```bash
   cp .env.example .env
   # VITE_API_TARGET=http://localhost:8001
   ```
3. **Iniciar en modo desarrollo:**
   ```bash
   pnpm dev
   ```
   La aplicación se abrirá en `http://localhost:5400`. Todas las peticiones `/api/*` se redirigen automáticamente al backend FastAPI en `http://localhost:8001` (configurable con `VITE_API_TARGET`).

---

## 🐳 Ejecución con Docker Compose

```bash
docker compose up --build
```
La aplicación estará disponible en `http://localhost:5400` (también en el puerto 80 dentro del contenedor). Nginx reenvía `/api/*` a `http://host.docker.internal:8001`, por lo que el backend debe estar corriendo en el host (ver `nginx.conf`).

---

## 👥 Trabajo Colaborativo

- **Si solo trabajas en Frontend:** Clona este repositorio, ejecuta `pnpm dev` y conecta tu variable `VITE_API_TARGET` a tu backend local o a una instancia remota de pruebas.
- **Si trabajas en Fullstack:** Clona ambos repositorios dentro de una carpeta padre (ej. `Student_Visual_Carrer/`) para desarrollar de forma integrada.
