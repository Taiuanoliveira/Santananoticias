// Upload de imagens usando Cloudinary (gratuito, sem cartão de credito)
const CLOUD_NAME = 'duast6nnl';
const UPLOAD_PRESET = 'Santana';

export async function enviarImagemCloudinary(arquivo) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', arquivo);
  formData.append('upload_preset', UPLOAD_PRESET);

  const resposta = await fetch(url, { method: 'POST', body: formData });
  if (!resposta.ok) {
    const erro = await resposta.text();
    throw new Error('Falha no upload da imagem: ' + erro);
  }
  const dados = await resposta.json();
  return dados.secure_url;
}
