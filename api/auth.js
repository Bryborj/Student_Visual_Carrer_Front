import { MongoClient } from 'mongodb';
import crypto from 'crypto';

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

function hashEmail(email) {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return res.status(500).json({ error: 'Falta configuración de base de datos.' });
  }

  try {
    const { db } = await connectToDatabase(uri);
    const usersCol = db.collection('forum_users');
    const pinsCol = db.collection('forum_pins');

    const { action, email, pin, username, password, identifier } = req.body;

    // 1. ENVIAR PIN DE VERIFICACIÓN
    if (action === 'send_pin') {
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ error: 'Correo electrónico inválido.' });
      }

      const domain = email.split('@')[1].toLowerCase();
      if (!domain.includes('buap.mx')) {
        return res.status(400).json({ error: 'El correo debe ser institucional (contener buap.mx).' });
      }

      const emailHash = hashEmail(email);

      // Verificar si el usuario ya existe
      const existingUser = await usersCol.findOne({ emailHash });
      if (existingUser) {
        return res.status(400).json({ error: 'Este correo institucional ya está registrado en el foro. Por favor inicia sesión.' });
      }

      // Validación con Hunter API (si está disponible en entorno)
      const hunterUrl = process.env.emailVerifierURL;
      const hunterKey = process.env.emailVerifierKey;
      if (hunterUrl && hunterKey) {
        try {
          const response = await fetch(`${hunterUrl}?email=${encodeURIComponent(email)}&api_key=${hunterKey}`);
          const data = await response.json();
          if (!data.errors && data.data && data.data.status !== 'valid' && data.data.status !== 'accept_all') {
            return res.status(400).json({ error: 'El correo institucional no parece válido según verificación externa.' });
          }
        } catch (e) {
          console.warn("Hunter verification skipped due to error:", e);
        }
      }

      const generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutos

      await pinsCol.updateOne(
        { emailHash },
        { $set: { emailHash, pin: generatedPin, expiresAt } },
        { upsert: true }
      );

      // Envío de correo mediante API de Brevo (Recurso Gratuito - 300 emails/día)
      const brevoKey = process.env.BREVO_API_KEY;
      let emailSent = false;
      let brevoError = null;
      if (brevoKey) {
        try {
          const senderEmail = process.env.BREVO_SENDER_EMAIL || 'comunidad@buap.mx';
          const senderName = process.env.BREVO_SENDER_NAME || 'Foro Comunidad BUAP 🐺';
          const htmlContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 48px; margin-bottom: 8px;">🐺</div>
                <h2 style="color: #c084fc; margin: 0; font-size: 24px; font-weight: 800;">Foro Comunidad BUAP</h2>
                <p style="color: #38bdf8; font-size: 13px; font-weight: 600; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Verificación Institucional</p>
              </div>
              <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
                ¡Hola Lobo! Has solicitado registrarte en la comunidad. Tu código de verificación temporal es:
              </p>
              <div style="background-color: #1e293b; border: 2px dashed #a855f7; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #38bdf8;">${generatedPin}</span>
              </div>
              <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-bottom: 8px;">
                ⏱️ Este código expirará en <strong>15 minutos</strong>.
              </p>
              <hr style="border: none; border-top: 1px solid #334155; margin: 28px 0;" />
              <div style="text-align: center;">
                <span style="font-size: 11px; color: #64748b; display: inline-block; background-color: #1e293b; padding: 6px 12px; border-radius: 9999px; border: 1px solid #334155;">
                  🔒 Privacidad BUAP: Tu correo no se almacena, solo conservamos un hash SHA-256 anónimos.
                </span>
              </div>
            </div>
          `;

          const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoKey,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              sender: { name: senderName, email: senderEmail },
              to: [{ email: email }],
              subject: 'Código de Verificación PIN - Foro Comunidad BUAP 🐺',
              htmlContent
            })
          });
          const brevoData = await brevoRes.json();
          if (brevoRes.ok && brevoData.messageId) {
            emailSent = true;
            console.log(`✅ [Brevo Auth] PIN enviado exitosamente a ${email}. ID: ${brevoData.messageId}`);
          } else {
            console.error("❌ [Brevo Auth] Error en respuesta de Brevo:", brevoData);
            brevoError = brevoData.message || JSON.stringify(brevoData);
          }
        } catch (err) {
          console.error("❌ [Brevo Auth] Error de red con Brevo:", err);
          brevoError = err.message || 'Error de conexión con API Brevo';
        }
      } else {
        brevoError = "La variable BREVO_API_KEY no está disponible en este servidor/proceso.";
      }

      const disableDevPin = process.env.DISABLE_DEV_PIN === 'true' || process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development';

      if (!emailSent && disableDevPin) {
        return res.status(500).json({
          error: `No se pudo enviar el correo de verificación (Modo estricto/producción activo). Detalle Brevo: ${brevoError || 'Error de servicio'}`
        });
      }

      return res.status(200).json({
        success: true,
        message: emailSent ? 'PIN enviado a tu correo institucional.' : 'PIN generado con éxito.',
        emailSent,
        brevoError,
        devPin: disableDevPin ? undefined : generatedPin
      });
    }

    // 2. VERIFICAR PIN (Opcional por separado, o integrado en registro)
    if (action === 'verify_pin') {
      if (!email || !pin) return res.status(400).json({ error: 'Correo y PIN requeridos.' });
      const emailHash = hashEmail(email);
      const record = await pinsCol.findOne({ emailHash, pin });

      if (!record || Date.now() > record.expiresAt) {
        return res.status(400).json({ error: 'PIN incorrecto o expirado.' });
      }

      return res.status(200).json({ success: true, message: 'PIN verificado correctamente.' });
    }

    // 3. REGISTRAR USUARIO
    if (action === 'register') {
      if (!email || !pin || !username || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
      }

      if (username.length < 3) {
        return res.status(400).json({ error: 'El nombre de usuario debe tener al menos 3 caracteres.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      }

      const cleanUsername = username.trim();
      const existingName = await usersCol.findOne({ username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } });
      if (existingName) {
        return res.status(400).json({ error: 'Este nombre de usuario ya está ocupado. Elige otro.' });
      }

      const emailHash = hashEmail(email);
      const pinRecord = await pinsCol.findOne({ emailHash, pin });

      if (!pinRecord || Date.now() > pinRecord.expiresAt) {
        return res.status(400).json({ error: 'El PIN de verificación es incorrecto o ha expirado.' });
      }

      // Crear usuario en MongoDB sin guardar el correo real
      const passwordHash = hashPassword(password);
      const newUser = {
        username: cleanUsername,
        emailHash, // GUARDAMOS SOLO EL HASH DEL CORREO
        passwordHash,
        createdAt: new Date().toISOString()
      };

      await usersCol.insertOne(newUser);
      await pinsCol.deleteOne({ emailHash }); // Limpiar PIN usado

      return res.status(201).json({
        success: true,
        user: { username: cleanUsername, emailHash }
      });
    }

    // 4. INICIAR SESIÓN (CON CORREO O USUARIO Y CONTRASEÑA)
    if (action === 'login') {
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Ingresa tu usuario/correo y contraseña.' });
      }

      const cleanId = identifier.trim();
      let user = null;

      // Si tiene @ o termina en .mx, asumimos intento por correo y buscamos por su hash
      if (cleanId.includes('@')) {
        const emailHash = hashEmail(cleanId);
        user = await usersCol.findOne({ emailHash });
      } else {
        // Buscar por nombre de usuario (case-insensitive)
        user = await usersCol.findOne({ username: { $regex: new RegExp(`^${cleanId}$`, 'i') } });
      }

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Credenciales incorrectas. Verifica tu usuario/correo y contraseña.' });
      }

      return res.status(200).json({
        success: true,
        user: { username: user.username, emailHash: user.emailHash }
      });
    }

    return res.status(400).json({ error: 'Acción no válida.' });
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ error: 'Error interno del servidor en autenticación.' });
  }
}
