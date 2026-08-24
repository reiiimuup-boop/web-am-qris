export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, email, trx_id } = req.query;
  const JAGOPAY_KEY = 'jp_c49a23ea3d01a837e789c2bdb30b';

  try {
    // Action 1: Buat QRIS Dinamis
    if (action === 'create') {
      // Coba request menggunakan metode POST & GET sekaligus untuk memastikan
      const response = await fetch(`https://jagopay.my.id/api/qris`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          api_key: JAGOPAY_KEY,
          amount: 1000
        })
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        // Tampilkan teks asli dari JagoPay jika bukan JSON
        return res.status(400).json({ 
          status: false, 
          message: `Respon mentah JagoPay: ${text.substring(0, 80)}` 
        });
      }

      if (data.status && (data.data?.qris_url || data.qris_url)) {
        return res.status(200).json({
          status: true,
          qr_link: data.data?.qris_url || data.qris_url,
          qris_string: data.data?.qris_string || data.qris_string,
          trx_id: Date.now().toString()
        });
      }

      return res.status(400).json({ 
        status: false, 
        message: data.message || JSON.stringify(data) 
      });
    }

    // Action 2: Cek Status
    if (action === 'check') {
      const response = await fetch(`https://jagopay.my.id/api/mutasi?api_key=${JAGOPAY_KEY}`);
      const data = await response.json();

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
