import {load,save,normalize,qualify,isDuplicate} from './core.js';

const SNAPSHOT_URL='./artifacts/linkedin-decision-makers.json';
const $=id=>document.getElementById(id);
let snapshot=[];

async function fetchSnapshot(){
  const response=await fetch(`${SNAPSHOT_URL}?t=${Date.now()}`,{cache:'no-store'});
  if(!response.ok)throw Error(`تعذر تحميل نتائج LinkedIn Discovery (${response.status})`);
  const data=await response.json();
  if(!Array.isArray(data))throw Error('ملف LinkedIn Discovery غير صالح');
  return data;
}

function esc(value){return String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}
function score(row){return Number(row.qualification_score)||0;}
function priority(row){if(score(row)>=80||row.decision_power==='Very High')return 'عالية جدًا';if(score(row)>=65||row.decision_power==='High')return 'عالية';if(score(row)>=50)return 'متوسطة';return 'منخفضة';}
function filteredRows(){
  const q=($('linkedinDiscoverySearch')?.value||'').toLowerCase().trim();
  const min=Number($('linkedinMinScore')?.value||0);
  const power=$('linkedinPower')?.value||'All';
  const priorityOnly=$('linkedinPriority')?.checked;
  return snapshot.filter(r=>score(r)>=min&&(power==='All'||r.decision_power===power)&&(!priorityOnly||score(r)>=65||r.decision_power==='High'||r.decision_power==='Very High')&&(!q||JSON.stringify(r).toLowerCase().includes(q))).sort((a,b)=>score(b)-score(a));
}

function render(){
  const host=$('discoveryPanel');if(!host)return;
  const rows=filteredRows();
  const high=snapshot.filter(r=>score(r)>=65||r.decision_power==='High'||r.decision_power==='Very High').length;
  host.innerHTML=`<h3>LinkedIn Decision Makers — العملاء المحتملون</h3><div class="muted">إجمالي ${snapshot.length} | أولوية عالية ${high} | المعروض ${rows.length}</div><div class="grid"><input id="linkedinDiscoverySearch" placeholder="بحث بالاسم / الشركة / المنصب / النشاط" value="${esc($('linkedinDiscoverySearch')?.value||'')}"><select id="linkedinMinScore"><option value="0">كل التقييمات</option><option value="50">50+</option><option value="65">65+</option><option value="80">80+</option><option value="90">90+</option></select><select id="linkedinPower"><option value="All">كل مستويات القرار</option><option value="Very High">قرار شديد الارتفاع</option><option value="High">قرار مرتفع</option><option value="Medium">قرار متوسط</option><option value="Low">قرار منخفض</option></select><label style="padding:10px"><input id="linkedinPriority" type="checkbox" style="width:auto"> أولوية فقط</label></div><div class="tools"><button id="refreshLinkedIn">تحديث النتائج</button><button id="importLinkedIn">إضافة المعروض إلى Leads</button></div><div id="linkedinResult" class="muted"></div><div id="linkedinRows">${rows.slice(0,200).map((r,i)=>rowCard(r,i)).join('')||'<div class="empty">لا توجد نتائج مطابقة</div>'}</div>`;
  $('linkedinDiscoverySearch').oninput=render;$('linkedinMinScore').onchange=render;$('linkedinPower').onchange=render;$('linkedinPriority').onchange=render;
  $('refreshLinkedIn').onclick=refresh;$('importLinkedIn').onclick=()=>importRows(rows);
}

function rowCard(r,i){
  const email=(r.public_emails||[]).join(', ');
  const phones=(r.public_phones||[]).join(', ');
  const links=[];
  if(r.linkedin_url)links.push(`<a href="${esc(r.linkedin_url)}" target="_blank" rel="noopener">LinkedIn</a>`);
  if(r.company_website)links.push(`<a href="${esc(r.company_website)}" target="_blank" rel="noopener">موقع الشركة</a>`);
  return `<article class="card ${score(r)>=65?'priority':''}"><div><b>${i+1}. ${esc(r.name||'اسم غير متاح')}</b> — ${esc(r.role||'بدون منصب')}</div><b>${esc(r.company||'شركة غير محددة')}</b> <span class="muted">${esc(r.industry||'')}</span><div><span class="pill">Decision: ${esc(r.decision_power||'غير محدد')}</span><span class="pill">Priority: ${priority(r)}</span><span class="pill">Score: ${score(r)}</span></div><div class="muted">الاحتياج القانوني: ${esc((r.legal_needs||[]).join('، ')||'يحتاج مراجعة')}</div><div class="muted">الموقع: ${esc(r.company_domain||r.company_website||'غير متاح')} | الحجم: ${esc(r.company_size||'غير متاح')} | إثراء: ${esc(r.enrichment_status||'غير متاح')}</div>${email?`<div class="muted">بريد أعمال عام: ${esc(email)}</div>`:''}${phones?`<div class="muted">هاتف أعمال عام: ${esc(phones)}</div>`:''}<div class="links">${links.join('')}</div></article>`;
}

async function refresh(){const out=$('linkedinResult');if(out)out.textContent='جاري تحميل آخر نتائج LinkedIn Discovery...';try{snapshot=await fetchSnapshot();render();if($('linkedinResult'))$('linkedinResult').textContent='تم تحديث النتائج';}catch(error){if(out)out.textContent=error.message;}}

function importRows(rows){
  const leads=load().map(normalize);const fresh=[];const existingByCompany=new Set(leads.map(l=>String(l.company||'').trim().toLowerCase()).filter(Boolean));
  for(const row of rows){
    const company=String(row.company||'').trim();const name=String(row.name||'').trim();if(!company||!name)continue;
    const lead=qualify(normalize({
      first_name:name,last_name:'',role:row.role||'',company,industry:row.industry||'',email:'',linkedin_url:row.linkedin_url||'',source:'public_linkedin',permission:'NO',permission_source:'LinkedIn public discovery — لا يوجد إذن تواصل',permission_at:'',opted_out:false,status:'New',discovery_score:Number(row.discovery_score)||0,decision_power:row.decision_power||'',decision_power_score:Number(row.decision_power_score)||0,legal_needs:row.legal_needs||[],company_website:row.company_website||'',company_domain:row.company_domain||'',company_size:row.company_size||'',public_emails:row.public_emails||[],public_phones:row.public_phones||[],company_public_contact:row.company_public_contact||'',enrichment_status:row.enrichment_status||''
    }));
    const duplicate=leads.some(l=>isDuplicate(l,lead))||fresh.some(l=>isDuplicate(l,lead));
    if(duplicate)continue;fresh.push(lead);existingByCompany.add(company.toLowerCase());
  }
  if(!fresh.length)return alert('لا توجد Leads جديدة للإضافة. الموجود منها مكرر أو غير مكتمل.');
  save([...fresh,...leads]);alert(`تمت إضافة ${fresh.length} Lead إلى قائمة العملاء المحتملين. لا يوجد إذن تواصل تلقائيًا؛ المراجعة والإذن ما زالا مطلوبين.`);location.reload();
}

function init(){const tools=document.querySelector('.tools');if(!tools||$('discoveryPanel'))return;const panel=document.createElement('section');panel.id='discoveryPanel';panel.className='card';panel.innerHTML='<h3>LinkedIn Decision Makers</h3><div class="muted">جاري تحميل آخر نتائج Discovery...</div>';document.querySelector('main').insertBefore(panel,document.querySelector('#list'));refresh();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();