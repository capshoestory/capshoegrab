export async function sendWhatsAppMessage(targetPhone: string, message: string) {
  const token = process.env.WA_GATEWAY_TOKEN;

  // Jika token belum diisi, jalankan mode simulasi di Terminal
  if (!token || token === 'TOKEN_FONNTE_KAMU') {
    console.log('\n==================================================');
    console.log(`[WA SIMULATION] Mengirim ke: ${targetPhone}`);
    console.log(`[PESAN]:\n${message}`);
    console.log('==================================================\n');
    return;
  }

  // Format nomor agar sesuai dengan standar Fonnte
  let formattedPhone = targetPhone.replace(/[^0-9]/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.slice(1);
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: new URLSearchParams({
        target: formattedPhone,
        message: message,
      }),
    });

    const result = await response.json();
    console.log(`[WA SENT] Status ke ${formattedPhone}:`, result);
  } catch (error) {
    console.error('Gagal mengirim pesan WhatsApp via Fonnte:', error);
  }
}