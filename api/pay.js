export default async function handler(req, res) {
  // Izinkan akses dari mana saja (Bebas CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, email, trx_id } = req.query;
  const JAGOPAY_KEY = 'jp_c49a23ea3d01a837e789c2bdb30b';

  try {
    // Action 1: Buat QRIS Pembayaran
    if (action === 'create') {
      const response = await fetch('https://jagopay.my.id/api/deposit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: JAGOPAY_KEY,
          amount: 1000,
          code: 'QRIS'
        })
      });
      const data = await response.json();
      return res.status(200).json(data);
    }

    // Action 2: Cek Status Pembayaran
    if (action === 'check') {
      const response = await fetch(`https://jagopay.my.id/api/deposit/status?api_key=${JAGOPAY_KEY}&trx_id=${trx_id}`);
      const data = await response.json();

      // Jika Lunas, langsung trigger Magic Link dari server Vercel
      if (data.status === 'success' || data.status === 'paid' || data.data?.status === 'PAID') {
        const magicUrl = `https://api.kyzznekoo.my.id/api/alightmotion/v3/magic-link?email=${encodeURIComponent(email)}`;
        await fetch(magicUrl);
        return res.status(200).json({ paid: true });
      }

      return res.status(200).json({ paid: false });
    }

    return res.status(400).json({ error: 'Action tidak valid' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
  }
