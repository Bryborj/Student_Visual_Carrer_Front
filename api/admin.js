import { pool } from './db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { password, action, payload } = req.body;

  // Verificar contraseña de administrador
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'No autorizado. Contraseña incorrecta.' });
  }

  try {
    if (action === 'verify') {
      return res.status(200).json({ success: true, message: 'Autenticado' });
    }

    if (action === 'addPlan') {
      if (!payload || !payload.career || !payload.courses) {
        return res.status(400).json({ error: 'El plan debe contener career y courses.' });
      }

      let facultyId = null;
      if (payload.faculty) {
        const facRes = await pool.query(`
          INSERT INTO faculties (name, logo_url)
          VALUES ($1, $2)
          ON CONFLICT (name) DO UPDATE SET
            logo_url = COALESCE(NULLIF(EXCLUDED.logo_url, ''), faculties.logo_url)
          RETURNING id;
        `, [payload.faculty, payload.logo_url || '']);
        facultyId = facRes.rows[0].id;
      }

      const modalidad = payload.modalidad || payload.mode || 'Escolarizada';

      await pool.query(`
        INSERT INTO plans (career, modalidad, faculty_id, courses, electives, min_credits, max_credits)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (career, modalidad) DO UPDATE SET
          faculty_id = EXCLUDED.faculty_id,
          courses = EXCLUDED.courses,
          electives = EXCLUDED.electives,
          min_credits = EXCLUDED.min_credits,
          max_credits = EXCLUDED.max_credits;
      `, [
        payload.career,
        modalidad,
        facultyId,
        JSON.stringify(payload.courses || []),
        JSON.stringify(payload.electives || []),
        payload.min_credits || null,
        payload.max_credits || null
      ]);

      return res.status(200).json({ success: true, message: 'Plan agregado/actualizado correctamente.' });
    }

    return res.status(400).json({ error: 'Acción desconocida.' });
  } catch (error) {
    console.error('Database connection error in /api/admin:', error);
    res.status(500).json({ error: 'Failed to execute action in PostgreSQL.' });
  }
}
