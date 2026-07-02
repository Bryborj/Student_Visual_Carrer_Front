import { pool } from './db.js';

export default async function handler(req, res) {
  try {
    const query = `
      SELECT 
        p.id AS "_id",
        p.career,
        p.modalidad,
        f.name AS faculty,
        f.logo_url
      FROM plans p
      LEFT JOIN faculties f ON p.faculty_id = f.id;
    `;
    const { rows } = await pool.query(query);

    // Formatear _id como string por compatibilidad con frontend
    const plansData = rows.map(r => ({
      ...r,
      _id: r._id ? r._id.toString() : null
    }));

    res.status(200).json(plansData);
  } catch (error) {
    console.error('Database connection error in /api/plans-list:', error);
    res.status(500).json({ error: 'Failed to connect to the database or fetch data.' });
  }
}
