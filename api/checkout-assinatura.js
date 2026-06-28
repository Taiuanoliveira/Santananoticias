export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });
  const { planoId, usuarioId, usuarioEmail } = req.body || {};
  if (!planoId || !usuarioId || !usuarioEmail) return res.status(400).json({ erro: 'Dados incompletos.' });

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG || '{}');
    if (!getApps().length) initializeApp(firebaseConfig);
    const db = getFirestore();

    const cfgSnap = await getDoc(doc(db, 'configuracoes', 'pagamento'));
    const accessToken = cfgSnap.exists() ? cfgSnap.data().mercadoPagoAssinaturaToken : null;
    if (!accessToken) return res.status(500).json({ erro: 'Token de assinatura não configurado no painel admin.' });

    const PLANOS = {
      mensal_cartao:      { titulo: 'Veritas+ Mensal',      preco: 19.90, frequencia: 'months', intervalo: 1 },
      trimestral_cartao:  { titulo: 'Veritas+ Trimestral',  preco: 49.90, frequencia: 'months', intervalo: 3 },
      anual_cartao:       { titulo: 'Veritas+ Anual',       preco: 159.90, frequencia: 'years',  intervalo: 1 },
    };

    const plano = PLANOS[planoId];
    if (!plano) return res.status(400).json({ erro: 'Plano inválido.' });

    const baseUrl = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://veritasnoticias.vercel.app';

    // Cria plano de assinatura no Mercado Pago
    const mpRes = await fetch('https://api.mercadopago.com/preapproval_plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        reason: plano.titulo,
        auto_recurring: {
          frequency: plano.intervalo,
          frequency_type: plano.frequencia,
          transaction_amount: plano.preco,
          currency_id: 'BRL'
        },
        back_url: `${baseUrl}/planos.html?status=aprovado&plano=${planoId}`,
        payer_email: usuarioEmail,
        external_reference: `${usuarioId}|${planoId}`
      })
    });

    const mpDados = await mpRes.json();
    if (!mpDados.init_point) throw new Error('Mercado Pago não retornou link de assinatura.');
    return res.status(200).json({ checkoutUrl: mpDados.init_point });
  } catch (err) {
    console.error('Erro checkout assinatura:', err);
    return res.status(500).json({ erro: err.message });
  }
}
