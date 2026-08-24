export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, email } = req.query;
  const JAGOPAY_KEY = 'jp_c49a23ea3d01a837e789c2bdb30b';

  // Header penyamaran agar tidak dianggap bot oleh Cloudflare JagoPay
  const customHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache'
  };

  try {
    // Action 1: Buat QRIS Dinamis
    if (action === 'create') {
      const targetUrl = `https://jagopay.my.id/api/qris?api_key=${JAGOPAY_KEY}&amount=1000`;
      const response = await fetch(targetUrl, { headers: customHeaders });
      const rawText = await response.text();

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        return res.status(500).json({ 
          status: false, 
          message: 'IP Vercel diblokir JagoPay/Cloudflare. Silakan coba lagi beberapa saat.' 
        });
      }

      if (data.status && (data.data?.qris_url || data.qris_url)) {
        return res.status(200).json({
          status: true,
          qr_link: data.data?.qris_url || data.qris_url
        });
      }

      return res.status(400).json({ 
        status: false, 
        message: data.message || 'Gagal membuat QRIS dari JagoPay.' 
      });
    }

    // Action 2: Cek Status Mutasi
    if (action === 'check') {
      const targetUrl = `https://jagopay.my.id/api/mutasi?api_key=${JAGOPAY_KEY}`;
      const response = await fetch(targetUrl, { headers: customHeaders });
      const rawText = await response.text();

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        return res.status(200).json({ paid: false });
      }

      const isPaid = Array.isArray(data.data) && data.data.some(trx => parseInt(trx.amount) === 1000);

      if (isPaid) {
        const magicUrl = `https://api.kyzznekoo.my.id/api/alightmotion/v3/magic-link?email=${encodeURIComponent(email)}`;
        await fetch(magicUrl);
        return res.status(200).json({ paid: true });
      }

      return res.status(200).json({ paid: false });
    }

    return res.status(400).json({ status: false, message: 'Action tidak valid' });
  } catch (err) {
    return res.status(500).json({ status: false, message: `Server Error: ${err.message}` });
  }
  }
