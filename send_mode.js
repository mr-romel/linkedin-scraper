const MODE_KEY='khyrat_send_mode_v1';
const $=id=>document.getElementById(id);

function mode(){return $('sendMode')?.value==='batch'?'batch':'single'}
function checked(){return [...document.querySelectorAll('.lead-check:checked')]}

function applySelectionLimit(event){
  const target=event.target;
  if(!target?.classList?.contains('lead-check')||!target.checked)return;
  const rows=checked();
  if(mode()==='single'&&rows.length>1){target.checked=false;alert('وضع الإرسال الحالي: عميل واحد فقط. اختر «إرسال من 1 إلى 5 عملاء معًا» للسماح بالدفعة');return}
  if(mode()==='batch'&&rows.length>5){target.checked=false;alert('الحد الأقصى 5 عملاء محتملين في الدفعة');}
}

function applyMode(){
  const m=mode();
  localStorage.setItem(MODE_KEY,m);
  const rows=checked();
  if(m==='single'&&rows.length>1)rows.slice(1).forEach(x=>x.checked=false);
  const button=$('sendSelectedButton');
  if(button)button.textContent=m==='batch'?'إرسال المحدد — حتى 5':'إرسال المحدد — عميل واحد';
  const hint=$('sendModeHint');
  if(hint)hint.textContent=m==='batch'?'الوضع الحالي: إرسال دفعة من 1 إلى 5 عملاء محتملين':'الوضع الحالي: إرسال عميل واحد فقط';
}

function installGuards(){
  const originalSend=window.sendSelected;
  const originalNext=window.sendNextBatch;
  if(typeof originalSend==='function'){
    window.sendSelected=()=>{
      const rows=checked();
      if(mode()==='single'&&rows.length>1){rows.slice(1).forEach(x=>x.checked=false);return originalSend()}
      if(mode()==='batch'&&rows.length>5){rows.slice(5).forEach(x=>x.checked=false)}
      return originalSend();
    };
  }
  if(typeof originalNext==='function'){
    window.sendNextBatch=()=>{
      if(mode()==='single'){
        checked().forEach(x=>x.checked=false);
        const ready=[...document.querySelectorAll('.lead-check:not(:disabled)')];
        if(!ready.length)return alert('لا توجد رسائل جاهزة للإرسال');
        ready[0].checked=true;
        return alert('تم تحديد عميل واحد جاهز للإرسال. راجعه ثم اضغط إرسال المحدد');
      }
      return originalNext();
    };
  }
}

function init(){
  const select=$('sendMode');
  if(!select)return;
  const saved=localStorage.getItem(MODE_KEY);
  if(saved==='batch'||saved==='single')select.value=saved;
  select.onchange=applyMode;
  document.addEventListener('change',applySelectionLimit);
  installGuards();
  applyMode();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
