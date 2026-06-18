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
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return res.status(500).json({ error: 'Database URI is missing.' });
  }

  try {
    const { db } = await connectToDatabase(uri);
    
    // Obtener parámetros de búsqueda (opcionales)
    const careerQuery = req.query.career || "Ingeniería en Ciencias de la Computación";
    const modalidadQuery = req.query.modalidad;
    
    const matchStage = { career: careerQuery };
    if (modalidadQuery) {
        matchStage.modalidad = modalidadQuery;
    }

    const planData = await db.collection('plans').aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "faculties",
          localField: "facultyId",
          foreignField: "_id",
          as: "facultyData"
        }
      }
    ]).toArray();

    if (!planData || planData.length === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const plan = planData[0];
    
    // Reconstruir el objeto para el frontend
    if (plan.facultyData && plan.facultyData.length > 0) {
      plan.faculty = plan.facultyData[0].name;
      plan.logo_url = plan.facultyData[0].logo_url;
    }
    delete plan.facultyData;
    delete plan.facultyId;

    res.status(200).json(plan);
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to the database or fetch data.' });
  }
}
