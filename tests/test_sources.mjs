import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverySourceCatalog,sourceById,extractPublicCompanyCandidates,discoverFromPublicSource} from '../discovery_sources.js';

test('public Egyptian discovery source catalog is explicit',()=>{
  assert.equal(discoverySourceCatalog.length,4);
  assert.equal(sourceById('tiec_startups').source,'business_directory');
  assert.equal(sourceById('egypt_innovate').country,'Egypt');
  assert.equal(sourceById('itida_companies').type,'official_directory');
});

test('public company HTML parser keeps company links and removes navigation noise',()=>{
  const html=`<a href="/company/alpha">Alpha Health</a><a href="/login">Login</a><a href="/company/alpha">Alpha Health</a><a href="https://beta.example">Beta Tech</a>`;
  const rows=extractPublicCompanyCandidates(html,{source:'business_directory',baseUrl:'https://example.com/directory'});
  assert.equal(rows.length,2);
  assert.equal(rows[0].company,'Alpha Health');
  assert.equal(rows[0].source_url,'https://example.com/company/alpha');
  assert.equal(rows[1].company,'Beta Tech');
  assert.equal(rows[1].country,'Egypt');
});

test('public source fetch is injectable and never requires LinkedIn',async()=>{
  const calls=[];
  const rows=await discoverFromPublicSource('tiec_startups',{fetchImpl:async(url,options)=>{calls.push({url,options});return {ok:true,status:200,text:async()=>'<a href="/company/wuzzuf">Wuzzuf</a>'}}});
  assert.equal(calls.length,1);
  assert.match(calls[0].url,/tiec\.gov\.eg/);
  assert.equal(rows[0].company,'Wuzzuf');
  assert.equal(rows[0].source_id,'tiec_startups');
  assert.equal(rows[0].source_name,'TIEC Startups');
});
