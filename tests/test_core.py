import core

def test_lead_draft_and_send_gate():
 l=core.new_lead(first_name='Ahmed',last_name='',role='CEO',company='Acme',industry='saas',email='a@example.com',permission='YES')
 core.draft(l)
 assert l.status=='Email Ready' and 'Acme' in l.body
 assert core.can_send(l)
 l.permission='NO'
 assert not core.can_send(l)

def test_save_load(tmp_path):
 p=tmp_path/'leads.json';l=core.new_lead(first_name='A',last_name='',role='',company='B')
 core.save([l],p);assert core.load(p)[0].company=='B'
