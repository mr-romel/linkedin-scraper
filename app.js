const KEY='khyrat_leads_v1';
export const load=()=>JSON.parse(localStorage.getItem(KEY)||'[]');
export const save=x=>localStorage.setItem(KEY,JSON.stringify(x));
export const stages=['New','Qualified','Email Ready','Sent','Replied','Interested','Meeting','Proposal','Won','Lost'];
export function qualify(l){return !!(l.company&&l.email&&l.permission==='YES')}
export function next(l,status){return {...l,status}}
