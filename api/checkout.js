import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
const firebaseConfig = {apiKey:"AIzaSyDlDgm3PAvdqBnX0JHH0gFpzxb6Benhrg0",authDomain:"santanacom-e543e.firebaseapp.com",projectId:"santanacom-e543e",storageBucket:"santanacom-e543e.firebasestorage.app",messagingSenderId:"141469420917",appId:"1:141469420917:web:2ae7b4076a44fba0cc173c"};
function obterApp(){return getApps().length?getApps()[0]:initializeApp(firebaseConfig);}
const PLANOS={mensal:{titulo:"Veritas+ Mensal",preco:19.90,meses:1},trimestral:{titulo:"Veritas+ Trimestral",preco:49.90,meses:3},anual:{titulo:"Veritas+ Anual",preco:159.90,meses:12}};
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({erro:"Metodo nao permitido"});
  const{planoId,usuarioId,usuarioEmail}=req.body||{};
  if(!planoId||!usuarioId||!usuarioEmail)return res.status(400).json({erro:"Dados insuficientes"});
  const plano=PLANOS[planoId];
  if(!plano)return res.status(400).json({erro:"Plano invalido"});
  try{
    const db=getFirestore(obterApp());
    const cfgSnap=await getDoc(doc(db,"configuracoes","pagamento"));
    const cfg=cfgSnap.exists()?cfgSnap.data():{};
    const accessToken=cfg.mercadoPagoAccessToken||process.env.MP_ACCESS_TOKEN;
    if(!accessToken)return res.status(500).json({erro:"Access Token nao configurado. Configure no painel admin."});
    const baseUrl=process.env.VERCEL_URL?"https://"+process.env.VERCEL_URL:"https://veritasnoticias.vercel.app";
    const resposta=await fetch("https://api.mercadopago.com/checkout/preferences",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+accessToken},body:JSON.stringify({items:[{title:plano.titulo,quantity:1,unit_price:plano.preco,currency_id:"BRL"}],payer:{email:usuarioEmail},external_reference:usuarioId+"|"+planoId,back_urls:{success:baseUrl+"/planos.html?status=aprovado&plano="+planoId,failure:baseUrl+"/planos.html?status=falhou",pending:baseUrl+"/planos.html?status=pendente"},auto_return:"approved",notification_url:baseUrl+"/api/webhook-pagamento",metadata:{usuarioId,planoId,meses:plano.meses}})});
    const dados=await resposta.json();
    if(!resposta.ok)return res.status(500).json({erro:"Erro no Mercado Pago",detalhe:dados});
    return res.status(200).json({checkoutUrl:dados.init_point,preferenceId:dados.id});
  }catch(e){return res.status(500).json({erro:e.message});}
}