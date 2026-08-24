export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ status: false, message: 'Email wajib diisi' });

  const API_KEY = process.env.JAGOPAY_API_KEY || 'jp_c49a23ea3d01a837e789c2bdb30b';
  const BASE_URL = 'https://jagopay.my.id';

  try {
    const response = await fetch(`${BASE_URL}/api/deposit/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: API_KEY,
        amount: 1000,
        code: 'QRIS'
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
      }
