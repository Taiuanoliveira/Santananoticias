import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from "firebase/firestore";
const firebaseConfig = {apiKey:"AIzaSyDlDgm3PAvdqBnX0JHH0gFpzxb6Benhrg0",authDomain:"santanacom-e543e.firebaseapp.com",projectId:"santanacom-e543e",storageBucket:"santanacom-e543e.firebasestorage.app",messagingSenderId:"141469420917",appId:"1:141469420917:web:2ae7b4076a44fba0cc173c"};
function obterApp(){return getApps().length?getApps()[0]:initializeApp(firebaseConfig);}
export default async function handler(req,res){
  const chave=req.headers["x-cron-secret"]||req.query.secret;
  if(chave!==process.env.CRON_SECRET&&chave!=="veritas-cron-2026")return res.status(401).json({erro:"Nao autorizado"});
  try{
    const db=getFirestore(obterApp());
    const agora=new Date();
    let bloqueados=0,ativos=0;
    const q=query(collection(db,"usuarios"),where("planoStatus","==","ativo"));
    const snap=await getDocs(q);
    for(const d of snap.docs){
      const u=d.data();
      const vencimento=u.planoVencimento?new Date(u.planoVencimento):null;
      if(!vencimento)continue;
      if(vencimento<agora){await updateDoc(doc(db,"usuarios",d.id),{plano:"gratuito",planoStatus:"vencido",planoVencidoEm:agora.toISOString()});bloqueados++;}
      else{ativos++;}
    }
    return res.status(200).json({ok:true,verificados:snap.size,ativos,bloqueados});
  }catch(e){return res.status(500).json({erro:e.message});}
}