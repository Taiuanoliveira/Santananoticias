export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  const { para, titulo, resumo, link, categoria, autorNome } = req.body;

  if (!para || !titulo) {
    return res.status(400).json({ erro: 'Dados insuficientes' });
  }

  const corpo = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
      <div style="background:#0a0a0a;padding:20px 24px;">
        <h1 style="font-family:Georgia,serif;color:#fff;margin:0;font-size:24px;">
          Santana<span style="color:#00cc66">.com</span>
        </h1>
      </div>
      <div style="padding:28px 24px;">
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#00cc66;font-weight:700;">${categoria || 'Notícia'}</p>
        <h2 style="font-family:Georgia,serif;font-size:24px;line-height:1.3;margin:10px 0 14px;">${titulo}</h2>
        <p style="color:#555;font-size:15px;line-height:1.7;">${resumo || ''}</p>
        ${autorNome ? `<p style="font-size:13px;color:#888;margin-top:16px;">Por ${autorNome}</p>` : ''}
        <div style="margin-top:24px;">
          <a href="${link}" style="background:#0a0a0a;color:#fff;text-decoration:none;padding:13px 28px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Ler notícia completa</a>
        </div>
      </div>
      <div style="background:#f4f4f4;padding:16px 24px;font-size:12px;color:#888;text-align:center;">
        Você recebe este e-mail porque assinou a newsletter do Veritas Notícias.<br>
        <a href="https://santananoticias.vercel.app/perfil.html" style="color:#00cc66;">Gerenciar preferências</a>
      </div>
    </div>
  `;

  try {
    const resposta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: 'Veritas Notícias', email: 'afc710001@smtp-brevo.com' },
        to: Array.isArray(para) ? para.map(e => ({ email: e })) : [{ email: para }],
        subject: titulo + ' – Veritas Notícias',
        htmlContent: corpo
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      return res.status(500).json({ erro });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ erro: e.message });
  }
}
