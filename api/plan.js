import { pool } from './db.js';

export default async function handler(req, res) {
  try {
    const careerQuery = req.query.career || "Ingeniería en Ciencias de la Computación";
    const modalidadQuery = req.query.modalidad;

    let query = `
      SELECT 
        p.id AS "_id",
        p.career,
        p.modalidad,
        p.courses,
        p.electives,
        p.min_credits,
        p.max_credits,
        f.name AS faculty,
        f.logo_url
      FROM plans p
      LEFT JOIN faculties f ON p.faculty_id = f.id
      WHERE p.career = $1
    `;
    const params = [careerQuery];

    if (modalidadQuery) {
      query += ` AND p.modalidad = $2`;
      params.push(modalidadQuery);
    }

    query += ` LIMIT 1;`;

    const { rows } = await pool.query(query, params);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const plan = rows[0];
    if (plan._id) {
      plan._id = plan._id.toString();
    }

    res.status(200).json(plan);
  } catch (error) {
    console.error('Database connection error in /api/plan:', error);
    res.status(500).json({ error: 'Failed to connect to the database or fetch data.' });
  }
}
