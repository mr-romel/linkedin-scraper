const DEFAULT_ROLES=['CEO','Founder','Co-Founder','Owner','Managing Director','General Manager','Chairman','Partner','President','COO','CFO','HR Director','HR Manager','Head of HR','Legal Director','Legal Manager','Head of Legal','General Counsel','Procurement Manager','Administration Director','عضو منتدب','مدير عام','رئيس مجلس الإدارة','مؤسس','شريك مؤسس','رئيس تنفيذي','مدير الموارد البشرية','مدير الشؤون القانونية','مدير الشئون القانونية','مدير مشتريات'];
const DEFAULT_INDUSTRIES=['manufacturing','technology','software','fintech','healthcare','medical','construction','trading','logistics','real estate','food','services'];
const SEARCH_ENGINES={google:'https://www.google.com/search?q=',bing:'https://www.bing.com/search?q='};
function esc(value){return encodeURIComponent(String(value||''))}
function cleanText(value=''){return String(value).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&#39;/gi,"'").replace(/&quot;/gi,'"').replace(/&#x27;/gi,"'").replace(/\s+/g,' ').trim()}
function decodeUrl(value=''){let current=String(value);for(let i=0;i<3;i++){try{const next=decodeURIComponent(current);if(next===current)break;current=next}catch{break}}return current}
function linkedinUrl(value=''){
  const decoded=decodeUrl(value).replace(/&amp;/g,'&');
  const m=decoded.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[A-Za-z0-9%_-]+(?:\/)?/i);
  return m?`https://${m[0].replace(/^https?:\/\//i,'').replace(/\/$/,'')}`:'';
}
function extractLinkedInFromHref(href=''){
  const decoded=decodeUrl(href).replace(/&amp;/g,'&');
  const direct=linkedinUrl(decoded); if(direct)return direct;
  const candidates=decoded.match(/(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[^&\s"'<>]+/ig)||[];
  return linkedinUrl(candidates[0]||'');
}
function scoreLead(row){const title=String(row.title||row.role||'').toLowerCase();const snippet=String(row.snippet||'').toLowerCase();let score=0;if(/\b(ceo|founder|co-founder|owner|managing director|general manager|chairman|partner|president|coo|cfo)\b|مؤسس|رئيس مجلس|عضو منتدب|مدير عام|رئيس تنفيذي/.test(title))score+=45;else if(/\b(hr|human resources|legal|procurement|administration|finance|operations)\b|موارد بشرية|قانوني|مشتريات|إدارة|مالي|عمليات/.test(title))score+=32;if(/egypt|cairo|alexandria|مصر|القاهرة|الإسكندرية/.test(`${title} ${snippet}`))score+=20;if(row.company)score+=15;if(row.linkedin_url)score+=20;return Math.min(100,score)}
export function buildLinkedInQueries({roles=DEFAULT_ROLES,industries=DEFAULT_INDUSTRIES,country='Egypt',maxQueries=120}={}){const queries=[];for(const role of roles){for(const industry of industries){queries.push(`site:linkedin.com/in/ "${role}" "${industry}" "${country}"`);if(queries.length>=maxQueries)return queries}}return queries}
export function buildSearchUrl(query,{engine='google'}={}){const base=SEARCH_ENGINES[engine]||SEARCH_ENGINES.google;return `${base}${esc(query)}`}
function titleParts(title=''){const cleaned=cleanText(title).replace(/\s*\|\s*(LinkedIn|linkedin)$/i,'').trim();return cleaned.split(/\s+[-–—]\s+|\s*\|\s*/).map(x=>x.trim()).filter(Boolean)}
function extractName(title=''){const parts=titleParts(title);const first=parts[0]||'';return /linkedin|ceo|founder|director|manager|head of|chief|مدير|مؤسس|رئيس|عضو/i.test(first)?'':first}
function extractRole(title=''){const parts=titleParts(title);if(parts.length>=3)return parts[1];const cleaned=cleanText(title);const m=cleaned.match(/\b(CEO|Founder|Co-Founder|Owner|Managing Director|General Manager|Chairman|Partner|President|COO|CFO|HR Director|HR Manager|Head of HR|Legal Director|Legal Manager|Head of Legal|General Counsel|Procurement Manager|Administration Director)\b/i);return m?m[1]:''}
function extractCompany(title=''){const parts=titleParts(title);if(parts.length>=3)return parts.slice(2).join(' - ');if(parts.length===2 && !/^(CEO|Founder|Owner|Manager|Director|Partner|President)$/i.test(parts[1]))return parts[1];const m=cleanText(title).match(/\b(?:at|في)\s+(.+?)(?:\s*\|\s*LinkedIn)?$/i);return m?m[1].trim():''}
function extractCandidateText(anchorHtml){return cleanText(anchorHtml)}
export function parseSearchResults(html,{query='',engine='google'}={}){const text=String(html||'');const out=[];const seen=new Set();const linkRe=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;while((m=linkRe.exec(text))){const profile=extractLinkedInFromHref(m[1]);if(!profile)continue;const key=profile.toLowerCase();if(seen.has(key))continue;seen.add(key);const title=extractCandidateText(m[2]);const role=extractRole(title);const company=extractCompany(title);const row={linkedin_url:profile,name:extractName(title),role,company,title,snippet:'',query,engine,source:'linkedin_public_search'};row.discovery_score=scoreLead(row);out.push(row)}return out}
async function fetchSearch(url,fetchImpl,timeoutMs){return fetchImpl(url,{headers:{'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128 Safari/537.36','Accept':'text/html,application/xhtml+xml','Accept-Language':'en-US,en;q=0.8,ar;q=0.6'},redirect:'follow',signal:AbortSignal.timeout(timeoutMs)})}
export async function discoverLinkedInPublic({queries=buildLinkedInQueries(),engine='google',fetchImpl=globalThis.fetch,timeoutMs=20000,maxResults=100}={}){if(typeof fetchImpl!=='function')throw Error('Fetch غير متاح في بيئة التشغيل');const results=[];const seen=new Set();for(const query of queries){let response=null;let html='';let usedEngine=engine;try{response=await fetchSearch(buildSearchUrl(query,{engine}),fetchImpl,timeoutMs);if(response.ok)html=await response.text()}catch{}
    let rows=html?parseSearchResults(html,{query,engine}):[];
    if(!rows.length && engine!=='bing'){try{const fallback=await fetchSearch(buildSearchUrl(query,{engine:'bing'}),fetchImpl,timeoutMs);if(fallback.ok)rows=parseSearchResults(await fallback.text(),{query,engine:'bing'});usedEngine='bing'}catch{}}
    for(const row of rows){row.engine=usedEngine;const key=row.linkedin_url.toLowerCase();if(seen.has(key))continue;seen.add(key);results.push(row);if(results.length>=maxResults)return results}
    await new Promise(r=>setTimeout(r,450));
  }
  return results.sort((a,b)=>b.discovery_score-a.discovery_score);
}
export const linkedinDiscoveryRules={publicSearchOnly:true,noLinkedInLogin:true,noControlBypass:true,noAutomatedLinkedInMessaging:true,defaultRoles:DEFAULT_ROLES,defaultIndustries:DEFAULT_INDUSTRIES,searchFallback:'bing'};
