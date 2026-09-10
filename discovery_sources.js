const SOURCE_CATALOG=[
  {id:'tiec_startups',name:'TIEC Startups',type:'official_directory',source:'business_directory',url:'https://tiec.gov.eg/English/Pages/StartupsCompanies.aspx',country:'Egypt',notes:'Public startup directory maintained by TIEC'},
  {id:'egypt_innovate',name:'EgyptInnovate Startups',type:'official_directory',source:'business_directory',url:'https://egyptinnovate.com/en/entities/startup',country:'Egypt',notes:'Public startup ecosystem directory'},
  {id:'itida_companies',name:'ITIDA Companies Database',type:'official_directory',source:'business_directory',url:'https://login.itida.gov.eg/SimpleSearch.aspx',country:'Egypt',notes:'Public ICT company search/database'},
  {id:'egyptian_startups',name:'Egyptian Startups Directory',type:'public_directory',source:'business_directory',url:'https://egyptianstartups.com/directory/',country:'Egypt',notes:'Public Egypt-focused startup directory'}
];

export const discoverySourceCatalog=SOURCE_CATALOG;
export function sourceById(id){return SOURCE_CATALOG.find(x=>x.id===id)||null}
export function discoveryFetchOptions({timeoutMs=15000,userAgent='Khyrat-Lead-Discovery/1.0'}={}){return {headers:{'User-Agent':userAgent,Accept:'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(timeoutMs)}}
function stripHtml(value=''){return String(value).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&#39;/gi,"'").replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim()}
function absoluteUrl(href,baseUrl){try{return new URL(href,baseUrl).href}catch(_){return ''}}
function sourceLinkAllowed(source,href){
  const u=String(href||'').toLowerCase();
  if(u.includes('egyptinnovate.com'))return /\/entities\/profile\//i.test(u);
  if(u.includes('tiec.gov.eg'))return /startup|company|companies/i.test(u);
  if(u.includes('itida.gov.eg'))return /company|companies|profile/i.test(u);
  if(u.includes('egyptianstartups.com'))return /\/startup|\/company|#directory/i.test(u);
  return true;
}
export function extractPublicCompanyCandidates(html,{source='business_directory',baseUrl='',sourceId=''}={}){
  const text=String(html||''),byUrl=new Map();
  const anchorRe=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
  while((m=anchorRe.exec(text))){
    const href=absoluteUrl(m[1],baseUrl),label=stripHtml(m[2]);
    if(!href||!label||label.length<3||label.length>120)continue;
    if(/^(home|search|login|sign in|sign up|contact|about|next|previous|load more|view profile|read more|open app resource library|open the interactive egypt startup directory|browse founder resources|explore startups|startup gallery|innovation map|meet investors|register your entity|continue with linkedin|continue with google|continue with email|faqs|privacy policy|terms of service)$/i.test(label))continue;
    if(/^(https?:\/\/|mailto:|javascript:)/i.test(label))continue;
    if(!sourceLinkAllowed(source,href))continue;
    const key=href.toLowerCase();
    const row={company:label,source,source_url:href,discovery_source_url:baseUrl,country:'Egypt',source_id:sourceId};
    const prior=byUrl.get(key);if(!prior||label.length>prior.company.length)byUrl.set(key,row);
  }
  return [...byUrl.values()];
}
async function fetchWithRetry(fetchImpl,url,options,retries=2){let last;for(let attempt=0;attempt<=retries;attempt++){try{return await fetchImpl(url,options)}catch(error){last=error;if(attempt<retries)await new Promise(r=>setTimeout(r,500*(attempt+1)))}}throw last}
export async function discoverFromPublicSource(sourceId,{fetchImpl=globalThis.fetch,timeoutMs=15000}={}){
  const source=sourceById(sourceId);if(!source)throw Error(`مصدر Discovery غير معروف: ${sourceId}`);
  if(typeof fetchImpl!=='function')throw Error('Fetch غير متاح في بيئة التشغيل');
  const response=await fetchWithRetry(fetchImpl,source.url,discoveryFetchOptions({timeoutMs}),2);
  if(!response.ok)throw Error(`فشل جلب المصدر ${source.name}: HTTP ${response.status}`);
  const html=await response.text();
  return extractPublicCompanyCandidates(html,{source:source.source,baseUrl:source.url,sourceId:source.id}).map(x=>({...x,source_name:source.name}));
}