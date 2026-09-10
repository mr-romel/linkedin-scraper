import test from 'node:test';
import assert from 'node:assert/strict';
import {ingestCandidates,summarizeIngestion} from '../ingest.js';

test('ingestion normalizes allowed Arabic sources and accepts qualified candidates',()=>{const r=ingestCandidates([{company:'Tech Co',industry:'SaaS',role:'CEO',email:'a@x.com',source:'موقع',permission:'YES',permission_source:'form'}]);assert.equal(r.accepted.length,1);assert.equal(r.accepted[0].source,'website');assert.equal(r.accepted[0].status,'Qualified')})
test('ingestion rejects unsafe sources and duplicates',()=>{const existing=[{company:'Old',email:'a@x.com',source:'website',permission:'YES',permission_source:'form'}];const r=ingestCandidates([{company:'Unsafe',industry:'saas',role:'CEO',email:'b@x.com',source:'linkedin_scrape'},{company:'Dup',industry:'saas',role:'CEO',email:'A@X.COM',source:'website'}],existing);assert.equal(r.rejected.length,1);assert.equal(r.duplicates.length,1);assert.equal(r.accepted.length,0)})
test('ingestion summary is deterministic',()=>{const s=summarizeIngestion({accepted:[{}],duplicates:[{},{}],rejected:[{}]});assert.deepEqual(s,{accepted:1,duplicates:2,rejected:1,total:4})})
