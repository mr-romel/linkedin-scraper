import {ingestCandidates,summarizeIngestion} from './ingest.js';

const SNAPSHOT_URL='https://raw.githubusercontent.com/mr-romel/linkedin-scraper/main/artifacts/public-discovery.json';

export async function fetchDiscoverySnapshot(fetchImpl=globalThis.fetch){
  const response=await fetchImpl(`${SNAPSHOT_URL}?t=${Date.now()}`,{cache:'no-store'});
  if(!response.ok)throw Error(`تعذر تحميل نتائج Discovery (${response.status})`);
  const data=await response.json();
  if(!data||!Array.isArray(data.results))throw Error('ملف Discovery غير صالح');
  return data;
}

export function discoveryCandidates(data){
  const rows=[];
  for(const result of data.results||[]){
    if(result.status!=='ok')continue;
    for(const row of result.candidates||[])rows.push({...row,source:row.source||'business_directory',discovery_status:'discovered'});
  }
  return rows;
}

export function mergeDiscoveryIntoLeads(candidates,existing){
  const existingCompanies=new Set((Array.isArray(existing)?existing:[]).map(l=>String(l.company||'').trim().toLowerCase()).filter(Boolean));
  const fresh=(Array.isArray(candidates)?candidates:[]).filter(row=>{
    const company=String(row.company||'').trim().toLowerCase();
    if(!company||existingCompanies.has(company))return false;
    existingCompanies.add(company);return true;
  });
  const result=ingestCandidates(fresh,existing);
  return {...result,summary:summarizeIngestion(result)};
}

export function discoverySummaryText(data){
  const s=data.summary||{};
  return `آخر Discovery: ${s.total_candidates||0} شركة | مصادر ناجحة: ${s.successful_sources||0} | مصادر فاشلة: ${s.failed_sources||0}`;
}

export const discoverySnapshotUrl=SNAPSHOT_URL;