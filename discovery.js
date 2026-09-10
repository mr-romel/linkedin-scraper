const ALLOWED_SOURCES=['website','business_directory','referral','public_company_page','manual','consented_import'];
const TARGET_INDUSTRIES=['saas','software','tech','technology','fintech','ecommerce','health','medical','برمجيات','تقنية','تكنولوجيا','تجارة إلكترونية','طبي'];
const TARGET_ROLES=['ceo','founder','co-founder','chief executive','مدير عام','مدير تنفيذي','مؤسس','شريك مؤسس','رئيس مجلس','عضو منتدب'];
export function discoverySourceAllowed(source){return ALLOWED_SOURCES.includes(String(source||'').trim().toLowerCase())}
export function isTargetIndustry(industry){const x=String(industry||'').trim().toLowerCase();return TARGET_INDUSTRIES.some(k=>x.includes(k))}
export function isTargetRole(role){const x=String(role||'').trim().toLowerCase();return TARGET_ROLES.some(k=>x.includes(k))}
export function validateCandidate(l){const errors=[];if(!l||!String(l.company||'').trim())errors.push('company');if(!String(l.source||'').trim())errors.push('source');if(l.source&&!discoverySourceAllowed(l.source))errors.push('source_not_allowed');if(l.permission==='YES'&&!String(l.permission_source||'').trim())errors.push('permission_source');if(l.permission==='NO'&&l.opted_out!==true)errors.push('opted_out');return {valid:errors.length===0,errors}}
export function discoveryScore(l){let score=0;if(isTargetIndustry(l.industry))score+=35;if(isTargetRole(l.role))score+=35;if(l.email)score+=15;if(l.source)score+=15;return Math.min(100,score)}
export function prepareCandidate(l){const result={...l,source:String(l.source||'').trim().toLowerCase(),discovery_score:discoveryScore(l)};return {...result,discovery_eligible:validateCandidate(result).valid&&result.discovery_score>=50}}
export const discoveryRules={allowedSources:ALLOWED_SOURCES,targetIndustries:TARGET_INDUSTRIES,targetRoles:TARGET_ROLES,noLinkedInScraping:true,noAutomatedLinkedInMessaging:true}
