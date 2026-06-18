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
      
      // Normalizar la facultad
      if (payload.faculty) {
        let facultyRecord = await db.collection('faculties').findOne({ name: payload.faculty });
        if (!facultyRecord) {
            const result = await db.collection('faculties').insertOne({ 
                name: payload.faculty, 
                logo_url: payload.logo_url || '' 
            });
            payload.facultyId = result.insertedId;
        } else {
            payload.facultyId = facultyRecord._id;
            // Si mandan un logo nuevo, lo actualizamos (opcional)
            if (payload.logo_url && payload.logo_url !== facultyRecord.logo_url) {
                await db.collection('faculties').updateOne(
                    { _id: facultyRecord._id },
                    { $set: { logo_url: payload.logo_url } }
                );
            }
        }
        delete payload.faculty;
        delete payload.logo_url;
      }
      
      // Upsert usando career y modalidad como identificador único
      const query = { career: payload.career };
      if (payload.modalidad) {
          query.modalidad = payload.modalidad;
      }

      await db.collection('plans').updateOne(
        query,
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
