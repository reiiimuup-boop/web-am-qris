export default async function handler(req, res) {
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
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          api_key: JAGOPAY_KEY,
          amount: 1000,
          code: 'QRIS'
        })
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return res.status(500).json({ status: false, message: `Respons JagoPay bukan JSON: ${text.substring(0, 100)}` });
      }

      return res.status(200).json(data);
    }

    // Action 2: Cek Status Pembayaran
    if (action === 'check') {
      const response = await fetch(`https://jagopay.my.id/api/deposit/status?api_key=${JAGOPAY_KEY}&trx_id=${trx_id}`);
      const data = await response.json();

      if (data.status === 'success' || data.status === 'paid' || data.data?.status === 'PAID') {
        const magicUrl = `https://api.kyzznekoo.my.id/api/alightmotion/v3/magic-link?email=${encodeURIComponent(email)}`;
        await fetch(magicUrl);
        return res.status(200).json({ paid: true });
      }

      return res.status(200).json({ paid: false, raw: data });
    }

    return res.status(400).json({ status: false, message: 'Action tidak valid' });
  } catch (err) {
    return res.status(500).json({ status: false, message: `Server Error: ${err.message}` });
  }
          }
