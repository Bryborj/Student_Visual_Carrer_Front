import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase(uri) {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri);
  const db = client.db('study_plans');

  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { password, action, payload } = req.body;

  // Verificar contraseña de administrador
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'No autorizado. Contraseña incorrecta.' });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return res.status(500).json({ error: 'Database URI is missing.' });
  }

  try {
    const { db } = await connectToDatabase(uri);

    if (action === 'verify') {
      return res.status(200).json({ success: true, message: 'Autenticado' });
    }

    if (action === 'addPlan') {
      if (!payload || !payload.career || !payload.courses) {
         return res.status(400).json({ error: 'El plan debe contener career y courses.' });
      }
      
      // Upsert (actualizar si existe, insertar si no)
      await db.collection('plans').updateOne(
        { career: payload.career },
        { $set: payload },
        { upsert: true }
      );
      
      return res.status(200).json({ success: true, message: 'Plan agregado/actualizado correctamente.' });
    }

    return res.status(400).json({ error: 'Acción desconocida.' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to the database or execute action.' });
  }
}
