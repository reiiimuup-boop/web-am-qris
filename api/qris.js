export default async function handler(req, res) {
  const { action, email } = req.query;
  const JAGOPAY_KEY = 'jp_c49a23ea3d01a837e789c2bdb30b';

  try {
    if (action === 'create') {
      const response = await fetch(`https://jagopay.my.id/api/qris?api_key=${JAGOPAY_KEY}&amount=1000`);
      const contentType = response.headers.get('content-type');

      // Jika JagoPay mengembalikan JSON
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return res.status(200).json(data);
      } 
      
      // Jika JagoPay mengembalikan gambar QRIS secara langsung
      const buffer = await response.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString('base64');
      const qrisUrl = `data:${contentType || 'image/png'};base64,${base64Image}`;
      
      return res.status(200).json({
        status: true,
        data: { qris_url: qrisUrl }
      });
    }

    if (action === 'check') {
      const response = await fetch(`https://jagopay.my.id/api/mutasi?api_key=${JAGOPAY_KEY}`);
      const data = await response.json();
      
      const isPaid = Array.isArray(data.data) && data.data.some(trx => parseInt(trx.amount) === 1000);

      if (isPaid && email) {
        await fetch(`https://api.kyzznekoo.my.id/api/alightmotion/v3/magic-link?email=${encodeURIComponent(email)}`);
        return res.status(200).json({ status: true, paid: true });
      }

      return res.status(200).json({ status: true, paid: false });
    }

    return res.status(400).json({ status: false, message: 'Action tidak valid' });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
                                   }
