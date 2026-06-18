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

    const plansData = await db.collection('plans').aggregate([
      {
        $lookup: {
          from: "faculties",
          localField: "facultyId",
          foreignField: "_id",
          as: "facultyData"
        }
      },
      // $unwind extrae el array facultyData a objeto, pero hacemos preserveNullAndEmptyArrays por si hay fallos
      { $unwind: { path: "$facultyData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          career: 1,
          modalidad: 1,
          faculty: "$facultyData.name",
          logo_url: "$facultyData.logo_url"
        }
      }
    ]).toArray();

    res.status(200).json(plansData);
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to the database or fetch data.' });
  }
}
