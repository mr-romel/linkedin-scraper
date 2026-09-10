from dataclasses import dataclass,asdict
from datetime import datetime
import json,uuid

@dataclass
class Lead:
 id:str; first_name:str; last_name:str; role:str; company:str; industry:str=''; email:str=''; linkedin_url:str=''; source:str=''; permission:str=''; status:str='New'; subject:str=''; body:str=''; sent_at:str=''; message_id:str=''
 def data(self): return asdict(self)

def draft(l):
 focus={'saas':'عقود العملاء والاشتراكات والـNDA والمسئولية','fintech':'العقود التشغيلية وتوزيع المسئوليات والالتزامات التنظيمية','healthtech':'عقود مقدمي الخدمة والمسئولية والبيانات','ecommerce':'عقود الموردين والعملاء وشروط البيع'}.get(l.industry.lower(),'العقود الأساسية والالتزامات والمسئولية وآلية إنهاء النزاع')
 l.subject=f'ملاحظة قانونية سريعة لـ {l.company}'
 l.body=f'''أستاذ {l.first_name}،\n\nبحكم نشاط {l.company}، من الطبيعي مع التوسع أن تظهر نقاط تعاقدية تحتاج مراجعة قبل أن تتحول لمشكلة، خصوصًا في {focus}.\n\nأنا محمود خيرت، محامي بالاستئناف ومتخصص في العقود والشئون القانونية للشركات. أقدر أراجع عقد محدد أو أقيّم مشكلة قانونية وأوضح المخاطر والتعديلات المقترحة.\n\nالخدمة متاحة في 3 مستويات حسب احتياج الشركة: مراجعة عقد واحد، مراجعة مجموعة العقود الأساسية، أو تقييم قانوني أوسع.\n\nلو مناسب، ابعتلي العقد أو وصف مختصر للمشكلة ونحدد أنسب مستوى.\n\nمحمود خيرت'''
 l.status='Email Ready';return l

def can_send(l): return bool(l.email and l.permission=='YES' and l.status=='Email Ready')

def mark_sent(l,message_id=''):
 l.status='Sent';l.sent_at=datetime.utcnow().isoformat();l.message_id=message_id;return l

def new_lead(**kw): return Lead(id=str(uuid.uuid4()),**kw)

def save(leads,path='leads.json'):
 with open(path,'w',encoding='utf8') as f: json.dump([x.data() for x in leads],f,ensure_ascii=False,indent=2)

def load(path='leads.json'):
 try:
  with open(path,encoding='utf8') as f:return [Lead(**x) for x in json.load(f)]
 except FileNotFoundError:return []
