export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt requerido' });

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY en variables de entorno' });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Eres un experto en crear agentes de voz con IA. Analiza este negocio y devuelve SOLO un JSON válido sin markdown ni backticks:
{
  "agentName": "nombre apropiado",
  "role": "rol del agente",
  "sector": "emoji + sector",
  "tone": "tono de comunicación",
  "language": "idioma principal",
  "channels": ["📞 Voz telefónica"],
  "systemPrompt": "prompt completo 150 palabras",
  "companyInfo": "info empresa 80 palabras",
  "restrictions": "restricciones separadas por punto",
  "recommendedVoice": "Rachel",
  "scenarios": ["Verificar disponibilidad", "Reservar cita"]
}
Negocio: ${prompt}`
      }]
    })
  });

  const data = await response.json();
  const text = data.content?.map(i => i.text || '').join('') || '';
  try {
    const agent = JSON.parse(text.replace(/```json|```/g, '').trim());
    return res.status(200).json({ agent });
  } catch {
    return res.status(500).json({ error: 'Error procesando respuesta' });
  }
}
