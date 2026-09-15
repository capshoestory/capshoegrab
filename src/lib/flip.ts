const FLIP_SECRET_KEY = process.env.FLIP_SECRET_KEY || '';
const FLIP_ENV = process.env.FLIP_ENV || 'sandbox';

const BASE_URL = FLIP_ENV === 'production' 
  ? 'https://bigflip.id/api/v2' 
  : 'https://bigflip.id/big_sandbox_api/v2';

// Basic Auth Encoding untuk Flip API (Secret Key + colon :)
const authHeader = 'Basic ' + Buffer.from(FLIP_SECRET_KEY + ':').toString('base64');

export async function createFlipBill(params: {
  title: string;
  amount: number;
  type: 'SINGLE' | 'MULTIPLE';
  redirectUrl: string;
  senderName?: string;
  senderEmail?: string;
}) {
  try {
    const response = await fetch(`${BASE_URL}/pwf/bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: new URLSearchParams({
        title: params.title,
        amount: params.amount.toString(),
        type: params.type || 'SINGLE',
        redirect_url: params.redirectUrl,
        is_address_required: '0',
        is_phone_number_required: '0',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Gagal membuat tagihan Flip');
    }

    return data; // Mengembalikan link pembayaran (link_url)
  } catch (error: any) {
    console.error('Error Flip API:', error);
    throw error;
  }
}