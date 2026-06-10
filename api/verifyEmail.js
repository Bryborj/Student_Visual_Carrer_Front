export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Correo electrónico inválido' });
  }

  const hunterUrl = process.env.emailVerifierURL;
  const hunterKey = process.env.emailVerifierKey;

  if (!hunterUrl || !hunterKey) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta (Hunter API)' });
  }

  try {
    // 1. Verificación de validez con Hunter API
    const response = await fetch(`${hunterUrl}?email=${encodeURIComponent(email)}&api_key=${hunterKey}`);
    const data = await response.json();

    if (data.errors) {
       return res.status(400).json({ error: data.errors[0].details || 'Error al verificar con Hunter API' });
    }

    const { status } = data.data;

    // Estados de Hunter: 'valid', 'invalid', 'accept_all', 'webmail', 'disposable', 'unknown'
    if (status !== 'valid' && status !== 'accept_all') {
      return res.status(400).json({ error: 'El correo no es válido o no existe según Hunter API.' });
    }

    // 2. Verificación de que pertenece al dominio BUAP
    const domain = email.split('@')[1].toLowerCase();
    if (!domain.includes('buap.mx')) {
      return res.status(400).json({ error: 'El correo debe ser institucional (contener buap.mx).' });
    }

    return res.status(200).json({ message: 'Correo verificado exitosamente', verified: true });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ error: 'Error interno del servidor al verificar el correo.' });
  }
}
