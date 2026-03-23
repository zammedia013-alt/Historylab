export default function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(200).json({ status: 'ERROR', message: 'Key NOT set' });
  return res.status(200).json({ status: 'OK', preview: key.slice(0,8)+'...' });
}
