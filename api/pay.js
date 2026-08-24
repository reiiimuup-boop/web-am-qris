export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, email } = req.query;
  const JAGOPAY_KEY = 'jp_c49a23ea3d01a837e789c2bdb30b';

  // Menyamarkan request Vercel agar dianggap Browser HP oleh Cloudflare
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json'
  };

  try {
    if (action === 'create') {
      const response = await fetch(`https://jagopay.my.id/api/qris?api_key=${JAGOPAY_KEY}&amount=1000`, { headers });
      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return res.status(500).json({ status: false, message: 'Respon JagoPay bukan JSON' });
      }

      if (data.status && data.data?.qris_url) {
        return res.status(200).json({
          status: true,
          qr_link: data.data.qris_url
        });
      }
      return res.status(400).json({ status: false, message: data.message || 'Gagal membuat QRIS' });
    }

    if (action === 'check') {
      const response = await fetch(`https://jagopay.my.id/api/mutasi?api_key=${JAGOPAY_KEY}`, { headers });
      const data = await response.json();

      const isPaid = Array.isArray(data.data) && data.data.some(trx => parseInt(trx.amount) === 1000);

      if (isPaid) {
        const magicUrl = `https://api.kyzznekoo.my.id/api/alightmotion/v3/magic-link?email=${encodeURIComponent(email)}`;
        await fetch(magicUrl);
        return res.status(200).json({ paid: true });
      }

      return res.status(200).json({ paid: false });
    }

    return res.status(400).json({ status: false, message: 'Action invalid' });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
  }
