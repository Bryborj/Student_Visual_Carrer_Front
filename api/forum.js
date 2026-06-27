import { MongoClient, ObjectId } from 'mongodb';

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
    const collection = db.collection('forum_posts');

    if (req.method === 'GET') {
      const { category, career } = req.query;
      const query = {};
      if (category && category !== 'Todos') {
        query.category = category;
      }
      if (career && career !== 'Todas') {
        query.career = career;
      }

      const posts = await collection.find(query).sort({ createdAt: -1 }).limit(50).toArray();
      return res.status(200).json(posts);
    }

    if (req.method === 'POST') {
      const { action, postId, title, content, category, authorEmail, career, commentContent } = req.body;

      if (!authorEmail) {
        return res.status(401).json({ error: 'Se requiere correo institucional BUAP para participar.' });
      }

      const username = authorEmail.split('@')[0];

      if (action === 'create_post') {
        if (!title || !content || !category) {
          return res.status(400).json({ error: 'Título, contenido y categoría son requeridos.' });
        }

        const newPost = {
          title,
          content,
          category,
          career: career || 'General',
          author: username,
          authorEmail,
          likes: 0,
          likedBy: [],
          comments: [],
          createdAt: new Date().toISOString()
        };

        const result = await collection.insertOne(newPost);
        newPost._id = result.insertedId;
        return res.status(201).json(newPost);
      }

      if (action === 'like_post') {
        if (!postId) return res.status(400).json({ error: 'Post ID requerido.' });
        const post = await collection.findOne({ _id: new ObjectId(postId) });
        if (!post) return res.status(404).json({ error: 'Post no encontrado.' });

        const likedBy = post.likedBy || [];
        const hasLiked = likedBy.includes(authorEmail);
        const update = hasLiked
          ? { $inc: { likes: -1 }, $pull: { likedBy: authorEmail } }
          : { $inc: { likes: 1 }, $addToSet: { likedBy: authorEmail } };

        await collection.updateOne({ _id: new ObjectId(postId) }, update);
        const updatedPost = await collection.findOne({ _id: new ObjectId(postId) });
        return res.status(200).json(updatedPost);
      }

      if (action === 'add_comment') {
        if (!postId || !commentContent) return res.status(400).json({ error: 'Post ID y comentario requeridos.' });
        const newComment = {
          id: new ObjectId().toString(),
          author: username,
          authorEmail,
          content: commentContent,
          createdAt: new Date().toISOString()
        };

        await collection.updateOne(
          { _id: new ObjectId(postId) },
          { $push: { comments: newComment } }
        );

        const updatedPost = await collection.findOne({ _id: new ObjectId(postId) });
        return res.status(200).json(updatedPost);
      }

      return res.status(400).json({ error: 'Acción no válida.' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Forum API error:', error);
    return res.status(500).json({ error: 'Error interno del servidor en el foro.' });
  }
}
