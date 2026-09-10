import {load,save,stages,normalize,draft,canSend,markSent,beginSend,isDuplicate,qualify,isFollowupDue} from './core.js';
import {ingestCandidates,summarizeIngestion} from './ingest.js';
import {queueSummary,nextSendBatch} from './queue.js';
import {getSendEndpoint,setSendEndpoint,sendLead} from './transport.js';
import {metrics,toCSV,parseCSV} from './analytics.js';
import {initLanguage} from './language.js';

let leads=load().map(normalize);
const $=id=>document.getElementById(id);
function persist(){save(leads)}
function download(name,text,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function clearForm(){['name','company','industry','email','linkedin','permissionSource'].forEach(id=>{$(id).value='' });$('role').value='';$('source').value='';$('permission').value='';$('permissionAt').value=''}

window.add=()=>{
  const permission=$('permission').value;
  const l=normalize({first_name:$('name').value.trim(),last_name:'',role:$('role').value.trim(),company:$('company').value.trim(),industry:$('industry').value.trim(),email:$('email').value.trim(),linkedin_url:$('linkedin').value.trim(),source:$('source').value.trim(),permission,permission_source:$('permissionSource').value.trim(),permission_at:$('permissionAt').value,followup_date:'',opted_out:permission==='NO',opted_out_at:permission==='NO'?new Date().toISOString():''});
  if(!l.first_name)return alert('اكتب اسم العميل');
  if(!l.company)return alert('اكتب اسم الشركة');
  if(!l.role)return alert('اختر المنصب');
  if(!l.source)return alert('حدد كيف وصلنا إلى العميل');
  if(permission==='YES'&&!l.permission_source)return alert('حدد مصدر الموافقة التسويقية');
  if(permission==='NO'&&!l.permission_source)return alert('اكتب سبب عدم الموافقة أو إلغاء الاشتراك');
  if(leads.find(x=>isDuplicate(x,l)))return alert('العميل المحتمل مكرر: نفس البريد أو رابط لينكدإن موجود بالفعل');
  leads.unshift(qualify(l));persist();clearForm();render();alert('تمت إضافة العميل المحتمل بنجاح');
};

window.makeDraft=id=>{const i=leads.findIndex(x=>x.id===id);if(i<0)return;leads[i]=draft(leads[i]);persist();render()};
window.qualifyLead=id=>{const i=leads.findIndex(x=>x.id===id);if(i<0)return;leads[i]=qualify(leads[i]);persist();render()};
window.editLead=id=>{const i=leads.findIndex(x=>x.id===id);if(i<0)return;const l=leads[i];const name=prompt('الاسم بالكامل',l.first_name||'');if(name===null)return;const email=prompt('البريد الإلكتروني',l.email||'');if(email===null)return;const follow=prompt('تاريخ المتابعة YYYY-MM-DD',l.followup_date||'');if(follow===null)return;const notes=prompt('ملاحظات',l.notes||'');if(notes===null)return;leads[i]={...l,first_name:name.trim(),last_name:'',email:email.trim(),followup_date:follow.trim(),notes};persist();render()};
window.recordReply=id=>{const i=leads.findIndex(x=>x.id===id);if(i<0)return;const note=prompt('ملاحظات الرد',leads[i].notes||'');if(note===null)return;const now=new Date().toISOString();leads[i]={...leads[i],status:'Replied',last_reply_at:now,last_contact:now,notes:note};persist();render()};
window.setStatus=(id,status)=>{const i=leads.findIndex(x=>x.id===id);if(i<0)return;if(status==='Sent')return alert('الإرسال يتم فقط من زر إرسال المحدد بعد نجاح مزود البريد');if(status==='Replied'&&!leads[i].last_reply_at){const now=new Date().toISOString();leads[i]={...leads[i],status,last_reply_at:now,last_contact:now}}else leads[i]={...leads[i],status};persist();render()};
window.setPermission=id=>{const i=leads.findIndex(x=>x.id===id);if(i<0)return;const v=prompt('إذن التسويق: اكتب YES أو NO',''+(leads[i].permission||''));if(v===null)return;const p=v.trim().toUpperCase();if(!['YES','NO'].includes(p))return alert('القيمة يجب أن تكون YES أو NO');const source=prompt('مصدر الإذن أو سبب عدم الموافقة',leads[i].permission_source||'');if(source===null)return;const now=new Date().toISOString();leads[i]={...leads[i],permission:p,permission_source:source.trim(),permission_at:now,opted_out:p==='NO',opted_out_at:p==='NO'?now:'',status:p==='NO'&&leads[i].status==='Email Ready'?'Qualified':leads[i].status};persist();render()};
window.setEndpoint=()=>{const v=prompt('رابط خدمة الإرسال (Google Apps Script)',getSendEndpoint());if(v===null)return;setSendEndpoint(v);alert(v.trim()?'تم حفظ رابط الإرسال':'تم مسح رابط الإرسال')};
window.sendSelected=async()=>{const ids=[...document.querySelectorAll('.lead-check:checked')].map(x=>x.value);if(!ids.length)return alert('حدد العملاء المحتملين للإرسال');if(ids.length>5)return alert('الحد الأقصى 5 عملاء محتملين في الدفعة');const selected=ids.map(id=>leads.find(l=>l.id===id)).filter(Boolean);const bad=selected.filter(l=>!canSend(l));if(bad.length)return alert('كل عميل محتمل يجب أن يحتوي بريدًا + إذن تسويقي = YES + مسودة جاهزة للإرسال + بدون إلغاء اشتراك ولم يسبق إرساله');if(!getSendEndpoint())return alert('أعد إعداد رابط خدمة الإرسال أولًا');if(!confirm(`تأكيد إرسال ${selected.length} رسائل؟`))return;let ok=0,errors=[];for(const original of selected){const i=leads.findIndex(x=>x.id===original.id);try{leads[i]=beginSend(leads[i]);persist();const data=await sendLead(leads[i]);leads[i]=markSent(leads[i],data.message_id);ok++}catch(e){leads[i]={...leads[i],send_lock:false};errors.push(`${original.company}: ${e.message}`)}}persist();render();alert(`تم الإرسال: ${ok}/${selected.length}${errors.length?'\n\nأخطاء:\n'+errors.join('\n'):''}`)};
window.sendNextBatch=()=>{const batch=nextSendBatch(leads);if(!batch.length)return alert('لا توجد رسائل جاهزة للإرسال مستوفية للشروط');batch.forEach(l=>{const el=document.querySelector(`.lead-check[value="${l.id}"]`);if(el)el.checked=true});alert(`تم تحديد أول ${batch.length} عملاء محتملين جاهزين للإرسال. راجعهم ثم اضغط إرسال المحدد`)};
window.removeLead=id=>{if(confirm('حذف العميل المحتمل؟')){leads=leads.filter(x=>x.id!==id);persist();render()}};
window.exportData=()=>download('khyrat-leads.json',JSON.stringify(leads,null,2),'application/json');
window.exportCSV=()=>download('khyrat-leads.csv',toCSV(leads),'text/csv;charset=utf-8');
window.importData=()=>{$('importFile').value='';$('importFile').click()};
window.importFileChange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!Array.isArray(x))throw 0;mergeImported(x)}catch(_){alert('ملف JSON غير صالح')}};r.readAsText(f)};
window.importCSV=()=>{$('importCSVFile').value='';$('importCSVFile').click()};
window.importCSVChange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{mergeImported(parseCSV(r.result))}catch(_){alert('ملف CSV غير صالح')}};r.readAsText(f)};
function mergeImported(imported){const result=ingestCandidates(imported,leads);if(result.accepted.length){leads=[...result.accepted,...leads];persist();render()}const s=summarizeIngestion(result);alert(`نتيجة الاستيراد\nمقبول: ${s.accepted}\nمكرر: ${s.duplicates}\nمرفوض: ${s.rejected}`)}
window.showDue=()=>{const due=leads.filter(l=>isFollowupDue(l));$('search').value='';$('filter').value='All';$('count').textContent=`${due.length} متابعة مستحقة`;$('list').innerHTML=due.map(l=>leadCard(l)).join('')||'<p>لا توجد متابعات مستحقة</p>';initLanguage()};
window.showDashboard=()=>{const m=metrics(leads),q=queueSummary(leads);$('search').value='';$('filter').value='All';$('count').textContent='لوحة المتابعة';$('list').innerHTML=`<article class="card"><h3>لوحة المتابعة</h3><div class="grid"><div>إجمالي العملاء المحتملين: <b>${m.total}</b></div><div>الجديد: <b>${q.new}</b></div><div>المؤهل: <b>${q.qualified}</b></div><div>جاهز للإرسال: <b>${q.emailReady}</b></div><div>الدفعة التالية: <b>${q.nextBatch}</b></div><div>تم الإرسال: <b>${m.sent}</b></div><div>الردود: <b>${m.replied}</b></div><div>إلغاء الاشتراك: <b>${m.optedOut}</b></div><div>متابعات مستحقة: <b>${q.followups}</b></div></div><hr>${Object.entries(m.byStatus).map(([s,n])=>`<div>${s}: <b>${n}</b></div>`).join('')}</article>`;initLanguage()};
function leadCard(l){return `<article class="card"><label><input class="lead-check" type="checkbox" value="${l.id}" ${canSend(l)?'':'disabled'}> جاهز للإرسال</label><div><b>${l.first_name||''}</b> — ${l.role||'بدون منصب'}</div><b>${l.company}</b> <span class="muted">${l.industry||''}</span><div>${l.email||'بدون بريد'}</div><div class="muted">${l.status} | Permission: ${l.permission||'—'} | Score: ${l.qualification_score||0} | Discovery: ${l.discovery_score||0}</div>${l.source?`<div class="muted">طريقة الوصول: ${l.source}</div>`:''}${l.permission_at?`<div class="muted">تاريخ الموافقة: ${l.permission_at}</div>`:''}${l.followup_date?`<div class="muted">متابعة: ${l.followup_date}${isFollowupDue(l)?' — مستحقة':''}</div>`:''}${l.last_reply_at?`<div class="muted">آخر رد: ${l.last_reply_at}</div>`:''}${l.notes?`<div>${l.notes}</div>`:''}${l.subject?`<hr><b>${l.subject}</b><pre>${l.body}</pre>`:''}${l.sent_at?`<hr><div class="muted">تم الإرسال: ${l.sent_at} | معرّف الرسالة: ${l.message_id}</div><pre>${l.sent_body||''}</pre>`:''}<div class="grid"><button onclick="qualifyLead('${l.id}')">تأهيل</button><button onclick="makeDraft('${l.id}')">إنشاء مسودة</button><button onclick="recordReply('${l.id}')">تسجيل رد</button><button onclick="editLead('${l.id}')">تفاصيل / تعديل</button><button onclick="setPermission('${l.id}')">إذن التسويق</button><select onchange="setStatus('${l.id}',this.value)">${stages.map(s=>`<option value="${s}" ${s===l.status?'selected':''}>${s}</option>`).join('')}</select><button onclick="removeLead('${l.id}')">حذف</button></div></article>`}
window.render=()=>{const q=$('search').value.toLowerCase(),f=$('filter').value;const rows=leads.filter(l=>(f==='All'||l.status===f)&&JSON.stringify(l).toLowerCase().includes(q));const m=metrics(leads),qs=queueSummary(leads);$('count').textContent=`${rows.length} عميل محتمل | جاهزة للإرسال: ${qs.emailReady} | مستحقة: ${qs.followups} | تم الإرسال: ${m.sent} | الردود: ${m.replied}`;$('list').innerHTML=rows.map(leadCard).join('')||'<p>لا يوجد عملاء محتملون</p>';initLanguage()};

$('search').oninput=render;
$('filter').onchange=render;
$('importFile').onchange=importFileChange;
$('importCSVFile').onchange=importCSVChange;
render();
initLanguage();
if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
