export default async function handler(req, res) {
  const { trx_id, email } = req.query;
  if (!trx_id || !email) return res.status(400).json({ status: false, message: 'Parameter tidak lengkap' });

  const API_KEY = process.env.JAGOPAY_API_KEY || 'jp_c49a23ea3d01a837e789c2bdb30b';
  const BASE_URL = 'https://jagopay.my.id';

  try {
    const response = await fetch(`${BASE_URL}/api/deposit/status?api_key=${API_KEY}&trx_id=${trx_id}`);
    const data = await response.json();

    // Jika JagoPay menyatakan LUNAS, pemicu Magic Link v3 dijalankan
    if (data.status === 'success' || data.status === 'paid' || data.data?.status === 'PAID') {
      const magicUrl = `https://api.kyzznekoo.my.id/api/alightmotion/v3/magic-link?email=${encodeURIComponent(email)}`;
      const magicRes = await fetch(magicUrl);
      const magicData = await magicRes.json();

      return res.status(200).json({
        paid: true,
        magicSent: magicData.status,
        message: 'Pembayaran Lunas! Magic Link telah dikirim ke email.'
      });
    }

    return res.status(200).json({ paid: false, message: 'Pembayaran belum terdeteksi' });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
        }
