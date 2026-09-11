import fs from 'node:fs/promises';
import {buildLinkedInQueries,discoverLinkedInPublic} from './linkedin_public_discovery.js';

const limit=Math.max(1,Math.min(500,Number(process.env.LINKEDIN_LEAD_LIMIT||100)));
const engine=process.env.LINKEDIN_SEARCH_ENGINE||'google';
const roles=(process.env.LINKEDIN_ROLES||'').split(',').map(x=>x.trim()).filter(Boolean);
const industries=(process.env.LINKEDIN_INDUSTRIES||'').split(',').map(x=>x.trim()).filter(Boolean);
const queries=buildLinkedInQueries({roles:roles.length?roles:undefined,industries:industries.length?industries:undefined,maxQueries:Math.max(10,Number(process.env.LINKEDIN_MAX_QUERIES||60))});
const leads=await discoverLinkedInPublic({queries,engine,maxResults:limit});
await fs.mkdir('artifacts',{recursive:true});
await fs.writeFile('artifacts/linkedin-decision-makers.json',JSON.stringify({generated_at:new Date().toISOString(),engine,queries,leads},null,2));
const csv=['name_or_title,company,linkedin_url,discovery_score,query,engine',...leads.map(x=>[x.title,x.company,x.linkedin_url,x.discovery_score,x.query,x.engine].map(v=>`"${String(v||'').replaceAll('"','""')}"`).join(','))].join('\\n');
await fs.writeFile('artifacts/linkedin-decision-makers.csv',csv);
console.log(JSON.stringify({engine,queries:queries.length,leads:leads.length,top:leads.slice(0,10)},null,2));
