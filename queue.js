import {normalize,canSend,isFollowupDue} from './core.js';
export function buildQueue(leads,today=new Date()){const all=(Array.isArray(leads)?leads:[]).map(normalize);return {new:all.filter(l=>l.status==='New'),qualified:all.filter(l=>l.status==='Qualified'),emailReady:all.filter(canSend),followups:all.filter(l=>isFollowupDue(l,today)),replied:all.filter(l=>l.status==='Replied')}}
export function nextSendBatch(leads,limit=5){return buildQueue(leads).emailReady.slice(0,Math.max(0,Math.min(5,Number(limit)||5)))}
export function queueSummary(leads,today=new Date()){const q=buildQueue(leads,today);return {new:q.new.length,qualified:q.qualified.length,emailReady:q.emailReady.length,followups:q.followups.length,replied:q.replied.length,nextBatch:Math.min(5,q.emailReady.length)}}
