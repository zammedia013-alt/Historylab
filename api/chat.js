export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = body.messages || [];
    const systemPrompt = body.system || '';

    // Gemini requires at least one message
    if (!messages.length) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content) }]
    }));

    const geminiBody = { contents, generationConfig: { maxOutputTokens: 1000 } };
    if (systemPrompt) {
      geminiBody.system_instruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody),
      }
    );

    const data = await response.json();

    // Log full response for debugging
    console.log('Gemini response:', JSON.stringify(data));

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';

    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
