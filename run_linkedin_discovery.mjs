import fs from 'node:fs/promises';
import {buildLinkedInQueries,discoverLinkedInPublic} from './linkedin_public_discovery.js';
import {enrichLinkedInLeads} from './linkedin_lead_enrichment.js';

const limit=Math.max(1,Math.min(500,Number(process.env.LINKEDIN_LEAD_LIMIT||100)));
const engine=process.env.LINKEDIN_SEARCH_ENGINE||'google';
const roles=(process.env.LINKEDIN_ROLES||'').split(',').map(x=>x.trim()).filter(Boolean);
const industries=(process.env.LINKEDIN_INDUSTRIES||'').split(',').map(x=>x.trim()).filter(Boolean);
const queries=buildLinkedInQueries({roles:roles.length?roles:undefined,industries:industries.length?industries:undefined,maxQueries:Math.max(10,Number(process.env.LINKEDIN_MAX_QUERIES||60))});
const discovered=await discoverLinkedInPublic({queries,engine,maxResults:limit});
const leads=enrichLinkedInLeads(discovered);
const generated_at=new Date().toISOString();
await fs.mkdir('artifacts',{recursive:true});
await fs.writeFile('artifacts/linkedin-decision-makers.json',JSON.stringify({generated_at,engine,queries,lead_count:leads.length,leads},null,2));
const headers=['name','role','company','industry','linkedin_url','decision_power','decision_power_score','legal_needs','qualification_score','discovery_score','source_confidence','query','engine'];
const csv=[headers.join(','),...leads.map(x=>headers.map(k=>`"${Array.isArray(x[k])?x[k].join('; '):String(x[k]??'').replaceAll('"','""')}"`).join(','))].join('\n');
await fs.writeFile('artifacts/linkedin-decision-makers.csv',csv);
await fs.writeFile('artifacts/linkedin-decision-makers-summary.json',JSON.stringify({generated_at,engine,queries:queries.length,leads:leads.length,high_priority:leads.filter(x=>x.qualification_score>=75).length,very_high_decision_power:leads.filter(x=>x.decision_power_score>=100).length},null,2));
console.log(JSON.stringify({engine,queries:queries.length,leads:leads.length,high_priority:leads.filter(x=>x.qualification_score>=75).length,top:leads.slice(0,10)},null,2));
