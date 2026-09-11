import assert from 'node:assert/strict';
import {buildCompanyQueries,extractSearchDomains,parseCompanyPage,enrichCompany,enrichCompanies} from '../company_enrichment.js';

assert.equal(buildCompanyQueries({company:'Example Tech'})[0],'"Example Tech" "Egypt" official website');
const searchHtml='<a href="https://www.example.com/">Example</a><a href="https://www.linkedin.com/company/example">LinkedIn</a>';
const domains=extractSearchDomains(searchHtml);
assert.equal(domains[0].domain,'example.com');

const page='<!doctype html><html><head><title>Example Tech Egypt</title><meta name="description" content="Software company in Egypt"></head><body>Contact us at hello@example.com or +20 100 123 4567. 51-200 employees. <a href="/contact">Contact</a></body></html>';
const parsed=parseCompanyPage(page,'https://www.example.com');
assert.equal(parsed.company_domain,'example.com');
assert.equal(parsed.company_description,'Software company in Egypt');
assert.equal(parsed.public_emails[0],'hello@example.com');
assert.ok(parsed.public_phones.length>=1);
assert.equal(parsed.company_size,'51-200');
assert.equal(parsed.contact_pages[0],'https://www.example.com/contact');

const fetchImpl=async url=>({ok:true,text:async()=>url.includes('google.com')?'<a href="https://www.example.com/">Example</a>':page});
const one=await enrichCompany({company:'Example Tech',fetchImpl});
assert.equal(one.enrichment_status,'enriched');
assert.equal(one.company_domain,'example.com');
assert.equal(one.public_emails[0],'hello@example.com');

const many=await enrichCompanies([{company:'Example Tech'},{company:'Example Tech'}],{fetchImpl});
assert.equal(many.length,2);
assert.equal(many[0].company_domain,'example.com');
assert.equal(many[1].company_domain,'example.com');
console.log('test_company_enrichment.mjs: ok');
