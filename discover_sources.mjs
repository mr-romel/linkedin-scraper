import fs from 'node:fs/promises';
import {discoverySourceCatalog,discoverFromPublicSource} from './discovery_sources.js';

const results=[];
for(const source of discoverySourceCatalog){
  const started=Date.now();
  try{
    const rows=await discoverFromPublicSource(source.id,{timeoutMs:20000});
    const unique=[];
    const seen=new Set();
    for(const row of rows){
      const company=String(row.company||'').trim();
      const key=company.toLowerCase();
      if(!company||seen.has(key))continue;
      seen.add(key);
      unique.push({...row,company});
    }
    results.push({source_id:source.id,source_name:source.name,status:'ok',count:unique.length,elapsed_ms:Date.now()-started,candidates:unique});
  }catch(error){
    results.push({source_id:source.id,source_name:source.name,status:'error',count:0,elapsed_ms:Date.now()-started,error:String(error?.message||error)});
  }
}

const summary={
  generated_at:new Date().toISOString(),
  sources:results.map(({source_id,source_name,status,count,elapsed_ms,error})=>({source_id,source_name,status,count,elapsed_ms,error})),
  total_candidates:results.reduce((sum,x)=>sum+x.count,0),
  successful_sources:results.filter(x=>x.status==='ok').length,
  failed_sources:results.filter(x=>x.status!=='ok').length
};

await fs.mkdir('artifacts',{recursive:true});
await fs.writeFile('artifacts/public-discovery.json',JSON.stringify({summary,results},null,2));
await fs.writeFile('artifacts/public-discovery-summary.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
if(summary.successful_sources===0)process.exitCode=1;
