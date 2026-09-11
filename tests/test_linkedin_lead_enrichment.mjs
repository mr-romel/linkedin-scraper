import assert from 'node:assert/strict';
import {enrichLinkedInLead,enrichLinkedInLeads} from '../linkedin_lead_enrichment.js';

const lead=enrichLinkedInLead({title:'Ahmed Ali - CEO - Example Tech',linkedin_url:'https://www.linkedin.com/in/ahmed-ali',query:'site:linkedin.com/in/ "CEO" "technology" "Egypt"'});
assert.equal(lead.name,'Ahmed Ali');
assert.equal(lead.role,'CEO');
assert.equal(lead.company,'Example Tech');
assert.equal(lead.decision_power,'Very High');
assert.ok(lead.decision_power_score>=100);
assert.ok(lead.legal_needs.length>=2);
assert.ok(lead.qualification_score>=70);

const rows=enrichLinkedInLeads([
  {title:'Sara - HR Manager - Factory Co',linkedin_url:'https://www.linkedin.com/in/sara',query:'"HR Manager" "manufacturing" "Egypt"'},
  {title:'Mona - Founder - Software Co',linkedin_url:'https://www.linkedin.com/in/mona',query:'"Founder" "software" "Egypt"'}
]);
assert.equal(rows[0].name,'Mona');
assert.ok(rows[0].qualification_score>=rows[1].qualification_score);
console.log('test_linkedin_lead_enrichment.mjs: ok');
