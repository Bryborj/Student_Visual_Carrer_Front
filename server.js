import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import plansListHandler from './api/plans-list.js';
import planHandler from './api/plan.js';
import adminHandler from './api/admin.js';
import authHandler from './api/auth.js';
import forumHandler from './api/forum.js';
import verifyEmailHandler from './api/verifyEmail.js';

// Cargar variables de entorno locales si existen (.env.local o .env)
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

// Sanitizar variables de entorno (eliminar comillas accidentales de Docker/Dokploy --env-file)
for (const key of Object.keys(process.env)) {
  if (typeof process.env[key] === 'string') {
    process.env[key] = process.env[key].replace(/^["']|["']$/g, '').trim();
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON body
app.use(express.json());

// API Endpoints
app.all('/api/plans-list', async (req, res) => {
  try {
    await plansListHandler(req, res);
  } catch (err) {
    console.error('Error in /api/plans-list:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.all('/api/plan', async (req, res) => {
  try {
    await planHandler(req, res);
  } catch (err) {
    console.error('Error in /api/plan:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.all('/api/admin', async (req, res) => {
  try {
    await adminHandler(req, res);
  } catch (err) {
    console.error('Error in /api/admin:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.all('/api/auth', async (req, res) => {
  try {
    await authHandler(req, res);
  } catch (err) {
    console.error('Error in /api/auth:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.all('/api/forum', async (req, res) => {
  try {
    await forumHandler(req, res);
  } catch (err) {
    console.error('Error in /api/forum:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.all('/api/verifyEmail', async (req, res) => {
  try {
    await verifyEmailHandler(req, res);
  } catch (err) {
    console.error('Error in /api/verifyEmail:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Servir archivos estáticos del frontend construido por Vite (dist)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // Fallback SPA para rutas de React
  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Endpoint API no encontrado' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('Advertencia: No se encontró la carpeta "dist". El servidor API está activo pero no servirá archivos estáticos hasta ejecutar "pnpm build".');
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});
