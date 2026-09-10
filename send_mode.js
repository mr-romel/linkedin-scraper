const MODE_KEY='khyrat_send_mode_v1';
const $=id=>document.getElementById(id);

function mode(){return $('sendMode')?.value==='batch'?'batch':'single'}
function applySelectionLimit(event){
  const target=event.target;
  if(!target?.classList?.contains('lead-check')||!target.checked)return;
  const checked=[...document.querySelectorAll('.lead-check:checked')];
  if(mode()==='single'&&checked.length>1){target.checked=false;alert('وضع الإرسال الحالي: عميل واحد فقط. اختر «حتى 5 عملاء» للسماح بإرسال دفعة');return}
  if(mode()==='batch'&&checked.length>5){target.checked=false;alert('الحد الأقصى 5 عملاء محتملين في الدفعة');}
}

function applyMode(){
  const m=mode();
  localStorage.setItem(MODE_KEY,m);
  const checked=[...document.querySelectorAll('.lead-check:checked')];
  if(m==='single'&&checked.length>1)checked.slice(1).forEach(x=>x.checked=false);
  const button=$('sendSelectedButton');
  if(button)button.textContent=m==='batch'?'إرسال المحدد — حتى 5':'إرسال المحدد — عميل واحد';
  const hint=$('sendModeHint');
  if(hint)hint.textContent=m==='batch'?'الوضع الحالي: إرسال دفعة من 1 إلى 5 عملاء محتملين':'الوضع الحالي: إرسال عميل واحد فقط';
}

function init(){
  const select=$('sendMode');
  if(!select)return;
  const saved=localStorage.getItem(MODE_KEY);
  if(saved==='batch'||saved==='single')select.value=saved;
  select.onchange=applyMode;
  document.addEventListener('change',applySelectionLimit);
  applyMode();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
