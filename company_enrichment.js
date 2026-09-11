const SEARCH_ENGINES={google:'https://www.google.com/search?q=',bing:'https://www.bing.com/search?q='};
const SIZE_PATTERNS=[
  [/\b(1-10|11-50|51-200|201-500|501-1000|1001-5000|5001-10000|10001\+)\s*(employees|employee|employees?)\b/i,'company_size_range'],
  [/\b(\d[\d,]*)\s*(?:\+\s*)?(employees|employee|staff|employees)\b/i,'employee_count'],
  [/\b(\d[\d,]*)\s*(?:موظف|موظفين|عامل|عاملين)\b/i,'employee_count']
];
function esc(v=''){return encodeURIComponent(String(v||''))}
function clean(v=''){return String(v).replace(/<script[\\s\\S]*?<\\/script>/gi,' ').replace(/<style[\\s\\S]*?<\\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\\s+/g,' ').trim()}
function uniq(a=[]){return [...new Set(a.filter(Boolean))]}
function absoluteUrl(url,base){try{return new URL(url,base).toString()}catch{return ''}}
function domainFromUrl(url=''){try{return new URL(url).hostname.replace(/^www\\./,'')}catch{return ''}}
export function buildCompanyQueries({company,country='Egypt'}={}){const c=String(company||'').trim();if(!c)return [];return [
  `"${c}" "${country}" official website`,
  `"${c}" "${country}" company`,
  `"${c}" "${country}" contact`,
  `"${c}" "${country}" employees`
]}
export function buildSearchUrl(query,{engine='google'}={}){return `${SEARCH_ENGINES[engine]||SEARCH_ENGINES.google}${esc(query)}`}
export function extractSearchDomains(html=''){
  const out=[];const re=/<a\\b[^>]*href=["']([^"']+)["'][^>]*>/gi;let m;
  while((m=re.exec(String(html)))){const href=m[1];if(/^https?:\\/\\//i.test(href)){const d=domainFromUrl(href);if(d&&!/google\\.|bing\\.|linkedin\\.|facebook\\.|instagram\\.|youtube\\.|wikipedia\\.|indeed\\.|glassdoor\\./i.test(d))out.push({url:href,domain:d})}}
  const text=clean(html);for(const m2 of text.matchAll(/\\b(?:https?:\\/\\/)?(?:www\\.)?([a-z0-9-]+\\.)+(?:com|net|org|eg|co|io)\\b/gi)){const d=domainFromUrl(`https://${m2[0].replace(/[),.;]+$/,'')}`);if(d&&!/google\\.|bing\\./i.test(d))out.push({url:`https://${d}`,domain:d})}
  const seen=new Set();return out.filter(x=>{if(seen.has(x.domain))return false;seen.add(x.domain);return true})
}
function firstMeta(html,names){const re=/<meta\\b[^>]*(?:name|property)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;let m;while((m=re.exec(String(html))))if(names.includes(m[1].toLowerCase()))return clean(m[2]);return ''}
export function parseCompanyPage(html='',baseUrl=''){
  const text=clean(html);const emails=uniq((String(html).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi)||[]).map(x=>x.toLowerCase())).filter(e=>!/@(?:example\\.|sentry\\.|wixpress\\.)/i.test(e)).slice(0,5);
  const phones=uniq((text.match(/(?:\\+?20[\\s.-]?)?(?:0?1[0125]\\d[\\s.-]?\\d{3}[\\s.-]?\\d{4}|0[2-9][0-9\\s.-]{7,12})/g)||[])).slice(0,5);
  const title=clean((String(html).match(/<title[^>]*>([\\s\\S]*?)<\\/title>/i)||[])[1]||'');
  const description=firstMeta(html,['description','og:description']);
  const sizeMatches=[];for(const [re,type] of SIZE_PATTERNS){const m=text.match(re);if(m)sizeMatches.push({value:m[1],type})}
  const links=[];const lr=/<a\\b[^>]*href=["']([^"']+)["'][^>]*>([\\s\\S]*?)<\\/a>/gi;let lm;while((lm=lr.exec(String(html)))){const label=clean(lm[2]);if(/contact|اتصل|تواصل|about|عن الشركة|company/i.test(label))links.push(absoluteUrl(lm[1],baseUrl))}
  return {company_website:baseUrl,company_domain:domainFromUrl(baseUrl),company_title:title,company_description:description,public_emails:emails,public_phones:phones,company_size:sizeMatches[0]?.value||'',company_size_source:sizeMatches[0]?.type||'',contact_pages:uniq(links).slice(0,5)}
}
export async function enrichCompany({company,country='Egypt',engine='google',fetchImpl=globalThis.fetch,timeoutMs=12000}={}){
  if(!company||typeof fetchImpl!=='function')return {company_name:company||'',enrichment_status:'not_available'};
  let candidates=[];for(const query of buildCompanyQueries({company,country})){try{const r=await fetchImpl(buildSearchUrl(query,{engine}),{headers:{'User-Agent':'Khyrat-Company-Enrichment/1.0','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(timeoutMs)});if(r.ok)candidates.push(...extractSearchDomains(await r.text()))}catch{}}
  candidates=uniq(candidates.map(x=>x.domain)).map(domain=>({domain,url:`https://${domain}`})).slice(0,3);
  for(const c of candidates){try{const r=await fetchImpl(c.url,{headers:{'User-Agent':'Khyrat-Company-Enrichment/1.0','Accept':'text/html'},signal:AbortSignal.timeout(timeoutMs)});if(!r.ok)continue;const data=parseCompanyPage(await r.text(),c.url);return {company_name:company,...data,enrichment_status:'enriched',source_confidence:Math.min(1,0.55+(data.company_description?0.15:0)+(data.public_emails.length?0.1:0)+(data.public_phones.length?0.1:0))}}catch{}}
  return {company_name:company,...(candidates[0]?{company_domain:candidates[0].domain,company_website:candidates[0].url}:{}),enrichment_status:'domain_only',source_confidence:candidates.length?0.45:0.2}
}
export async function enrichCompanies(rows=[],options={}){const cache=new Map();const out=[];for(const row of rows){const key=String(row.company||'').trim().toLowerCase();if(!key){out.push(row);continue}let data=cache.get(key);if(!data){data=await enrichCompany({company:row.company,...options});cache.set(key,data)}out.push({...row,...data,company_public_contact:uniq([...(data.public_emails||[]),...(data.public_phones||[])]).join('; ')});await new Promise(r=>setTimeout(r,400))}return out}
export const companyEnrichmentRules={publicDataOnly:true,noLinkedInLogin:true,noCredentialedScraping:true,noPrivateContactDiscovery:true}
