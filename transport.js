const KEY='khyrat_send_endpoint_v1';
export function getSendEndpoint(){return localStorage.getItem(KEY)||''}
export function setSendEndpoint(url){const v=String(url||'').trim();if(v)localStorage.setItem(KEY,v);else localStorage.removeItem(KEY);return v}
export async function sendLead(l,endpoint=getSendEndpoint()){
  if(!endpoint)throw Error('لم يتم إعداد رابط الإرسال')
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lead_id:l.id,email:l.email,first_name:l.first_name,company:l.company,subject:l.subject,body:l.body,permission:l.permission})})
  const data=await r.json().catch(()=>({}))
  if(!r.ok||!data.ok||!data.message_id)throw Error(data.error||`فشل الإرسال (${r.status})`)
  return data
}
