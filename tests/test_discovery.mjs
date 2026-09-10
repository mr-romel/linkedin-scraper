import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverySourceAllowed,isTargetIndustry,isTargetRole,validateCandidate,discoveryScore,prepareCandidate,discoveryRules} from '../discovery.js';

test('allowed discovery sources are explicit',()=>{assert.equal(discoverySourceAllowed('website'),true);assert.equal(discoverySourceAllowed('linkedin_scrape'),false);assert.equal(discoveryRules.noLinkedInScraping,true);assert.equal(discoveryRules.noAutomatedLinkedInMessaging,true)})
test('target industry and role matching works',()=>{assert.equal(isTargetIndustry('SaaS'),true);assert.equal(isTargetIndustry('manufacturing'),false);assert.equal(isTargetRole('CEO'),true);assert.equal(isTargetRole('Founder'),true);assert.equal(isTargetRole('accountant'),false)})
test('candidate validation requires safe source and permission metadata',()=>{assert.equal(validateCandidate({company:'A',source:'website',permission:'YES',permission_source:'form'}).valid,true);assert.equal(validateCandidate({company:'A',source:'linkedin_scrape',permission:'YES',permission_source:'x'}).valid,false);assert.equal(validateCandidate({company:'A',source:'website',permission:'YES'}).valid,false);assert.equal(validateCandidate({company:'A',source:'website',permission:'NO',opted_out:true}).valid,true)})
test('discovery score and eligibility are deterministic',()=>{const l=prepareCandidate({company:'Tech',industry:'saas',role:'CEO',email:'a@x.com',source:'website',permission:'YES',permission_source:'form'});assert.equal(l.discovery_score,100);assert.equal(l.discovery_eligible,true)})
