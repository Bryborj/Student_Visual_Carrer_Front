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
    // Hardcoded to fetch the current career plan. Can be made dynamic via query params later.
    const plan = await db.collection('plans').findOne({ career: "Ingeniería en Ciencias de la Computación" });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json(plan);
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Failed to connect to the database or fetch data.' });
  }
}
