const EXECUTIVE_TERMS=['ceo','chief executive officer','founder','co-founder','owner','managing director','general manager','chairman','partner','president','عضو منتدب','مدير عام','رئيس مجلس الإدارة','مؤسس','شريك مؤسس','رئيس تنفيذي'];
const FUNCTION_TERMS={
  legal:['legal','general counsel','counsel','lawyer','attorney','قانون','شؤون قانونية','الشئون القانونية','مستشار قانوني'],
  hr:['hr','human resources','people','talent','موارد بشرية','الموارد البشرية'],
  finance:['cfo','chief financial officer','finance','financial','مالية','مالي'],
  operations:['coo','chief operating officer','operations','تشغيل','عمليات'],
  procurement:['procurement','purchasing','supply chain','مشتريات','سلاسل الإمداد'],
  corporate:['corporate','company secretary','governance','corporate affairs','حوكمة','شركات']
};
const INDUSTRY_NEEDS={
  construction:['construction','contract','contracting','مشروعات','مقاولات'],
  real_estate:['real estate','property','developer','عقارات','تطوير عقاري'],
  manufacturing:['manufacturing','factory','industrial','تصنيع','مصنع','صناعي'],
  technology:['technology','software','saas','it','تقنية','برمجيات'],
  fintech:['fintech','payments','financial technology','مدفوعات','تكنولوجيا مالية'],
  healthcare:['healthcare','medical','hospital','clinic','pharma','رعاية صحية','طبي','صيدلة'],
  trading:['trading','import','export','distribution','تجارة','استيراد','تصدير','توزيع'],
  logistics:['logistics','shipping','freight','warehouse','لوجستيات','شحن','مخازن'],
  food:['food','beverage','restaurant','fmcg','أغذية','مشروبات','مطاعم'],
  services:['services','consulting','agency','خدمات','استشارات']
};
const NEED_LABELS={
  legal:'External legal counsel / legal operations',
  contracts:'Contracts & commercial agreements',
  employment:'Employment & HR compliance',
  corporate:'Corporate governance & company matters',
  procurement:'Procurement / vendor contracts',
  regulatory:'Regulatory & licensing compliance',
  disputes:'Disputes / claims risk'
};

function norm(v=''){return String(v).toLowerCase().replace(/[–—]/g,'-').replace(/\s+/g,' ').trim()}
function hasAny(text,terms){const s=norm(text);return terms.some(t=>s.includes(norm(t)))}
function splitTitle(raw=''){
  const parts=String(raw).split(/\s+[|–—-]\s+/).map(x=>x.trim()).filter(Boolean);
  return parts;
}
function inferName(title=''){
  const parts=splitTitle(title);
  if(!parts.length)return '';
  const first=parts[0];
  if(/linkedin|ceo|founder|director|manager|مدير|مؤسس|رئيس|عضو/.test(norm(first)))return '';
  return first.length<=80?first:'';
}
function inferRole(title=''){
  const parts=splitTitle(title);
  if(parts.length>=2)return parts[1];
  return title;
}
function inferCompany(title='',existing=''){
  if(existing)return existing.trim();
  const parts=splitTitle(title);
  return parts.length>=3?parts.slice(2).join(' - '):'';
}
function decisionPower(role=''){
  const r=norm(role);
  if(hasAny(r,EXECUTIVE_TERMS))return {label:'Very High',score:100};
  if(hasAny(r,['general counsel','legal director','head of legal','hr director','head of hr','cfo','coo','procurement director','administration director','مدير الشؤون القانونية','مدير الشئون القانونية','مدير الموارد البشرية']))return {label:'High',score:85};
  if(hasAny(r,['legal manager','hr manager','procurement manager','finance manager','operations manager','مدير قانوني','مدير مشتريات','مدير مالي','مدير عمليات']))return {label:'Medium-High',score:72};
  return {label:'Unknown',score:35};
}
function inferLegalNeeds({role='',industry='',snippet='',company=''}){
  const text=norm(`${role} ${industry} ${snippet} ${company}`);const needs=[];
  if(hasAny(text,FUNCTION_TERMS.legal)||hasAny(norm(role),['ceo','founder','owner','managing director','general manager','chairman','partner','مؤسس','مالك','مدير عام','رئيس مجلس']))needs.push('legal');
  if(hasAny(text,['contract','agreement','vendor','commercial','مقاول','تعاقد','عقد','اتفاقية']))needs.push('contracts');
  if(hasAny(text,FUNCTION_TERMS.hr)||hasAny(text,['employee','employment','staff','عمل','عمال','موظف']))needs.push('employment');
  if(hasAny(text,FUNCTION_TERMS.corporate)||hasAny(text,['company','shareholder','investment','startup','holding','شركة','مساهم','استثمار']))needs.push('corporate');
  if(hasAny(text,FUNCTION_TERMS.procurement)||hasAny(text,['vendor','supplier','purchase','مورد','شراء']))needs.push('procurement');
  if(hasAny(text,['license','licensed','regulatory','compliance','ترخيص','هيئة','تنظيم']))needs.push('regulatory');
  if(hasAny(text,['dispute','litigation','claim','arbitration','lawsuit','نزاع','تحكيم','دعوى','مطالبة']))needs.push('disputes');
  if(!needs.length)needs.push('contracts','corporate');
  return [...new Set(needs)];
}
function industryFit(industry='',query=''){
  const text=norm(`${industry} ${query}`);let best='';let bestScore=0;
  for(const [name,terms] of Object.entries(INDUSTRY_NEEDS)){
    const score=terms.filter(t=>text.includes(norm(t))).length;
    if(score>bestScore){best=name;bestScore=score;}
  }
  return {industry:industry||best,confidence:bestScore?Math.min(1,bestScore/2):0};
}
function qualification({decisionPowerScore,legalNeeds,industryConfidence,company,linkedin_url}){
  let score=0;score+=decisionPowerScore*0.45;score+=Math.min(100,legalNeeds.length*15)*0.25;score+=industryConfidence*100*0.15;score+=(company?10:0);score+=(linkedin_url?10:0);
  return Math.min(100,Math.round(score));
}

export function enrichLinkedInLead(row={}){
  const title=String(row.title||'').trim();
  const role=row.role||inferRole(title);
  const company=inferCompany(title,row.company);
  const name=row.name||row.full_name||inferName(title);
  const fit=industryFit(row.industry,row.query);
  const power=decisionPower(role);
  const legalNeeds=inferLegalNeeds({role,industry:fit.industry,snippet:row.snippet,company});
  const qualification_score=qualification({decisionPowerScore:power.score,legalNeeds,industryConfidence:fit.confidence,company,linkedin_url:row.linkedin_url});
  return {...row,name,role,company,industry:fit.industry,industry_confidence:fit.confidence,decision_power:power.label,decision_power_score:power.score,legal_needs:legalNeeds.map(k=>NEED_LABELS[k]||k),qualification_score,source_confidence:row.linkedin_url?0.75:0.35};
}

export function enrichLinkedInLeads(rows=[]){
  return rows.map(enrichLinkedInLead).sort((a,b)=>(b.qualification_score||0)-(a.qualification_score||0));
}

export const enrichmentRules={decisionPower:'role-based',legalNeed:'role+industry+snippet',publicDataOnly:true};
