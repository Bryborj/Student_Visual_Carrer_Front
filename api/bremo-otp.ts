/**
 * Helper y Endpoint de Vercel para envío de OTP (PIN) usando la API de Brevo (Transactional Email).
 * Recursos gratuitos: Brevo ofrece 300 correos gratis al día.
 */

export interface BrevoOTPResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envía el código PIN al correo institucional usando Brevo REST API v3
 */
export async function sendBrevoOTP(recipientEmail: string, pin: string): Promise<BrevoOTPResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'comunidad@buap.mx';
  const senderName = process.env.BREVO_SENDER_NAME || 'Foro Comunidad BUAP 🐺';

  if (!apiKey) {
    console.warn("⚠️ [Brevo OTP] No se encontró BREVO_API_KEY. Saltando envío real de correo.");
    return { success: false, error: 'BREVO_API_KEY no configurada en variables de entorno.' };
  }

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 8px;">🐺</div>
        <h2 style="color: #c084fc; margin: 0; font-size: 24px; font-weight: 800;">Foro Comunidad BUAP</h2>
        <p style="color: #38bdf8; font-size: 13px; font-weight: 600; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Verificación Institucional</p>
      </div>
      
      <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 24px;">
        ¡Hola Lobo! Has solicitado registrarte o acceder al foro comunitario. Utiliza el siguiente código de verificación temporal para confirmar tu correo institucional:
      </p>
      
      <div style="background-color: #1e293b; border: 2px dashed #a855f7; border-radius: 16px; padding: 24px; text-align: center; margin: 28px 0;">
        <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #38bdf8; text-shadow: 0 0 12px rgba(56, 189, 248, 0.4);">${pin}</span>
      </div>
      
      <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-bottom: 8px;">
        ⏱️ Este código expirará en <strong>15 minutos</strong>.
      </p>
      <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
        Si no solicitaste este código, puedes ignorar este correo de forma segura.
      </p>
      
      <hr style="border: none; border-top: 1px solid #334155; margin: 28px 0;" />
      
      <div style="text-align: center;">
        <span style="font-size: 11px; color: #64748b; display: inline-block; background-color: #1e293b; padding: 6px 12px; border-radius: 9999px; border: 1px solid #334155;">
          🔒 Privacidad BUAP: Tu correo no es almacenado públicamente, solo conservamos una firma hash SHA-256 anónima.
        </span>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: recipientEmail }],
        subject: 'Código de Verificación PIN - Foro Comunidad BUAP 🐺',
        htmlContent
      })
    });

    const data = await response.json();

    if (response.ok && data.messageId) {
      console.log(`✅ [Brevo OTP] Correo enviado exitosamente a ${recipientEmail}. ID: ${data.messageId}`);
      return { success: true, messageId: data.messageId };
    } else {
      console.error("❌ [Brevo OTP] Error en respuesta de Brevo:", data);
      return { success: false, error: data.message || 'Error desconocido de Brevo API' };
    }
  } catch (error: any) {
    console.error("❌ [Brevo OTP] Error de red al conectar con Brevo:", error);
    return { success: false, error: error.message || 'Error de red al conectar con Brevo' };
  }
}

// Handler para permitir pruebas directas o llamadas al endpoint independiente
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, pin } = req.body;
  if (!email || !pin) {
    return res.status(400).json({ error: 'Correo (email) y código (pin) requeridos.' });
  }

  const result = await sendBrevoOTP(email, pin);
  if (result.success) {
    return res.status(200).json({ success: true, messageId: result.messageId });
  } else {
    return res.status(500).json({ success: false, error: result.error });
  }
}
