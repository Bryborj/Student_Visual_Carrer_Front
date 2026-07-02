import { pool } from './db.js';
import crypto from 'crypto';

function formatPost(row) {
  if (!row) return null;
  return {
    _id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    career: row.career,
    author: row.author,
    emailHash: row.email_hash,
    likes: row.likes || 0,
    likedBy: row.liked_by || [],
    comments: row.comments || [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
  };
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { category, career } = req.query;
      let query = `SELECT * FROM forum_posts WHERE 1=1`;
      const params = [];

      if (category && category !== 'Todos') {
        params.push(category);
        query += ` AND category = $${params.length}`;
      }
      if (career && career !== 'Todas') {
        params.push(career);
        query += ` AND career = $${params.length}`;
      }

      query += ` ORDER BY created_at DESC LIMIT 50;`;

      const { rows } = await pool.query(query, params);
      return res.status(200).json(rows.map(formatPost));
    }

    if (req.method === 'POST') {
      const { action, postId, title, content, category, username, emailHash, career, commentContent } = req.body;

      if (!username || !emailHash) {
        return res.status(401).json({ error: 'Debes iniciar sesión en el foro para participar.' });
      }

      if (action === 'create_post') {
        if (!title || !content || !category) {
          return res.status(400).json({ error: 'Título, contenido y categoría son requeridos.' });
        }

        const newId = crypto.randomUUID();
        const createdAt = new Date();

        const insertQuery = `
          INSERT INTO forum_posts (id, title, content, category, career, author, email_hash, likes, liked_by, comments, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 0, '[]'::jsonb, '[]'::jsonb, $8)
          RETURNING *;
        `;
        const { rows } = await pool.query(insertQuery, [
          newId,
          title,
          content,
          category,
          career || 'General',
          username,
          emailHash,
          createdAt
        ]);

        return res.status(201).json(formatPost(rows[0]));
      }

      if (action === 'like_post') {
        if (!postId) return res.status(400).json({ error: 'Post ID requerido.' });

        const postRes = await pool.query(`SELECT * FROM forum_posts WHERE id = $1;`, [postId]);
        if (postRes.rows.length === 0) return res.status(404).json({ error: 'Post no encontrado.' });

        const post = postRes.rows[0];
        const likedBy = post.liked_by || [];
        const hasLiked = likedBy.includes(emailHash);

        let updatedLikedBy;
        let likesDelta;
        if (hasLiked) {
          updatedLikedBy = likedBy.filter(e => e !== emailHash);
          likesDelta = -1;
        } else {
          updatedLikedBy = [...likedBy, emailHash];
          likesDelta = 1;
        }

        const updateRes = await pool.query(`
          UPDATE forum_posts
          SET likes = likes + $1, liked_by = $2
          WHERE id = $3
          RETURNING *;
        `, [likesDelta, JSON.stringify(updatedLikedBy), postId]);

        return res.status(200).json(formatPost(updateRes.rows[0]));
      }

      if (action === 'add_comment') {
        if (!postId || !commentContent) return res.status(400).json({ error: 'Post ID y comentario requeridos.' });

        const newComment = {
          id: crypto.randomUUID(),
          author: username,
          emailHash,
          content: commentContent,
          createdAt: new Date().toISOString()
        };

        const updateRes = await pool.query(`
          UPDATE forum_posts
          SET comments = COALESCE(comments, '[]'::jsonb) || $1::jsonb
          WHERE id = $2
          RETURNING *;
        `, [JSON.stringify([newComment]), postId]);

        if (updateRes.rows.length === 0) {
          return res.status(404).json({ error: 'Post no encontrado.' });
        }

        return res.status(200).json(formatPost(updateRes.rows[0]));
      }

      return res.status(400).json({ error: 'Acción no válida.' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Forum API error:', error);
    return res.status(500).json({ error: 'Error interno del servidor en el foro.' });
  }
}
