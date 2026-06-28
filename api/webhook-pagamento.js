import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
const firebaseConfig = {apiKey:"AIzaSyDlDgm3PAvdqBnX0JHH0gFpzxb6Benhrg0",authDomain:"santanacom-e543e.firebaseapp.com",projectId:"santanacom-e543e",storageBucket:"santanacom-e543e.firebasestorage.app",messagingSenderId:"141469420917",appId:"1:141469420917:web:2ae7b4076a44fba0cc173c"};
function obterApp(){return getApps().length?getApps()[0]:initializeApp(firebaseConfig);}
const MESES={mensal:1,trimestral:3,anual:12};
export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).end();
  const{type,data}=req.body||{};
  if(type!=="payment")return res.status(200).json({ok:true});
  try{
    const db=getFirestore(obterApp());
    const cfgSnap=await getDoc(doc(db,"configuracoes","pagamento"));
    const cfg=cfgSnap.exists()?cfgSnap.data():{};
    const accessToken=cfg.mercadoPagoAccessToken||process.env.MP_ACCESS_TOKEN;
    const resposta=await fetch("https://api.mercadopago.com/v1/payments/"+data.id,{headers:{"Authorization":"Bearer "+accessToken}});
    const pagamento=await resposta.json();
    if(pagamento.status!=="approved")return res.status(200).json({ok:true,status:pagamento.status});
    const[usuarioId,planoId]=(pagamento.external_reference||"").split("|");
    if(!usuarioId||!planoId)return res.status(400).json({erro:"Referencia invalida"});
    const meses=MESES[planoId]||1;
    const agora=new Date();
    const vencimento=new Date(agora);
    vencimento.setMonth(vencimento.getMonth()+meses);
    await updateDoc(doc(db,"usuarios",usuarioId),{plano:planoId,planoStatus:"ativo",planoInicio:agora.toISOString(),planoVencimento:vencimento.toISOString(),planoPagamentoId:String(pagamento.id),planoAtualizadoEm:agora.toISOString()});
    await setDoc(doc(db,"pagamentos",String(pagamento.id)),{usuarioId,planoId,valor:pagamento.transaction_amount,status:"aprovado",dataAprovacao:agora.toISOString(),vencimento:vencimento.toISOString(),metodoPagamento:pagamento.payment_method_id||"",mp_id:pagamento.id});
    return res.status(200).json({ok:true});
  }catch(e){return res.status(500).json({erro:e.message});}
}