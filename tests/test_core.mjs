import test from 'node:test';
import assert from 'node:assert/strict';
import {normalize,draft,canSend,markSent,sendKey} from '../core.js';

test('draft makes a lead email-ready',()=>{const l=draft(normalize({company:'Acme',first_name:'علي',industry:'saas',email:'a@x.com',permission:'YES'}));assert.equal(l.status,'Email Ready');assert.match(l.subject,/Acme/);assert.match(l.body,/علي/)})
test('send gate requires permission and blocks sent leads',()=>{const base=normalize({company:'Acme',email:'a@x.com',permission:'YES',status:'Email Ready',subject:'s',body:'b'});assert.equal(canSend(base),true);const sent=markSent(base,'msg-1');assert.equal(canSend(sent),false);assert.equal(sent.message_id,'msg-1');assert.equal(sent.sent_subject,'s');assert.equal(sent.sent_body,'b')})
test('send key is deterministic',()=>{const l=normalize({id:'1',email:'a@x.com',subject:'s',body:'b'});assert.equal(sendKey(l),sendKey({...l}))})
