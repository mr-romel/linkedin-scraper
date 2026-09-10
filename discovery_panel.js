import {load,save,normalize,qualify,isDuplicate} from './core.js';

const SNAPSHOT_URL='https://raw.githubusercontent.com/mr-romel/linkedin-scraper/main/artifacts/public-discovery.json';
const $=id=>document.getElementById(id);

async function fetchSnapshot(){
  const response=await fetch(`${SNAPSHOT_URL}?t=${Date.now()}`,{cache:'no-store'});
  if(!response.ok)throw Error(`تعذر تحميل نتائج Discovery (${response.status})`);
  const data=await response.json();
  if(!data||!Array.isArray(data.results))throw Error('ملف Discovery غير صالح');
  return data;
}

function candidateRows(data){
  const rows=[];
  for(const result of data.results||[]){
    if(result.status!=='ok')continue;
    for(const row of result.candidates||[]){
      const company=String(row.company||'').trim();
      if(company.length>=3)rows.push({...row,company,source:row.source||'business_directory'});
    }
  }
  const seen=new Set();
  return rows.filter(row=>{const key=String(row.company).toLowerCase();if(seen.has(key))return false;seen.add(key);return true});
}

function renderPanel(data){
  const host=$('discoveryPanel');if(!host)return;
  const s=data.summary||{};
  const rows=candidateRows(data);
  host.innerHTML=`<h3>Discovery — مصادر الشركات</h3><div class="muted">آخر تشغيل: ${s.generated_at||'غير متاح'} | شركات مكتشفة: ${rows.length} | مصادر ناجحة: ${s.successful_sources||0} | مصادر فاشلة: ${s.failed_sources||0}</div><button id="refreshDiscovery">تحديث Discovery</button><button id="importDiscovery">إضافة الشركات المكتشفة للطابور</button><div id="discoveryResult" class="muted"></div><div class="card" style="max-height:280px;overflow:auto">${rows.slice(0,100).map((r,i)=>`<div style="padding:6px 0;border-bottom:1px solid #eee"><b>${i+1}. ${r.company}</b><div class="muted">${r.source_name||r.source||''}</div></div>`).join('')||'لا توجد نتائج مكتشفة بعد'}</div>`;
  $('refreshDiscovery').onclick=refresh;
  $('importDiscovery').onclick=()=>importRows(rows);
}

async function refresh(){
  const out=$('discoveryResult');if(out)out.textContent='جاري تحميل آخر نتائج Discovery...';
  try{const data=await fetchSnapshot();renderPanel(data);if($('discoveryResult'))$('discoveryResult').textContent='تم تحديث نتائج Discovery';}
  catch(error){if(out)out.textContent=error.message}
}

function importRows(rows){
  const leads=load().map(normalize);
  const companies=new Set(leads.map(l=>String(l.company||'').trim().toLowerCase()).filter(Boolean));
  const fresh=[];
  for(const row of rows){
    const key=String(row.company||'').trim().toLowerCase();
    if(!key||companies.has(key))continue;
    const lead=qualify(normalize({...row,first_name:'',last_name:'',role:'',email:'',linkedin_url:'',permission:'',permission_source:'',permission_at:'',opted_out:false,status:'New'}));
    if(!isDuplicate(lead,lead))fresh.push(lead);
    companies.add(key);
  }
  if(!fresh.length)return alert('لا توجد شركات جديدة للإضافة');
  save([...fresh,...leads]);
  alert(`تم ربط Discovery بالطابور وإضافة ${fresh.length} شركة جديدة. سيتم تحديث الواجهة الآن`);
  location.reload();
}

function init(){
  const tools=document.querySelector('.tools');
  if(!tools||$('discoveryPanel'))return;
  const panel=document.createElement('section');panel.id='discoveryPanel';panel.className='card';panel.innerHTML='<h3>Discovery — مصادر الشركات</h3><div class="muted">جاري تحميل آخر نتائج Discovery...</div>';
  document.querySelector('main').insertBefore(panel,document.querySelector('#list'));
  refresh();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();