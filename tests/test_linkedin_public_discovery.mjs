import assert from 'node:assert/strict';
import {buildLinkedInQueries,buildSearchUrl,parseSearchResults,linkedinDiscoveryRules} from '../linkedin_public_discovery.js';

const queries=buildLinkedInQueries({roles:['CEO','Founder'],industries:['technology'],country:'Egypt'});
assert.equal(queries.length,2);
assert.match(queries[0],/site:linkedin\.com\/in/);
assert.match(buildSearchUrl(queries[0]),/^https:\/\/www\.google\.com\/search\?q=/);

const html=`<a href="https://www.linkedin.com/in/example-ceo/">Ahmed CEO - Example Company | LinkedIn</a><a href="https://www.linkedin.com/in/example-ceo/">duplicate</a><a href="https://example.com/not-linkedin">ignore</a>`;
const rows=parseSearchResults(html,{query:queries[0]});
assert.equal(rows.length,1);
assert.equal(rows[0].linkedin_url,'https://www.linkedin.com/in/example-ceo');
assert.equal(rows[0].company,'Example Company');
assert.ok(rows[0].discovery_score>=45);
assert.equal(linkedinDiscoveryRules.publicSearchOnly,true);
assert.equal(linkedinDiscoveryRules.noLinkedInLogin,true);
assert.equal(linkedinDiscoveryRules.noControlBypass,true);
console.log('linkedin public discovery tests: ok');
