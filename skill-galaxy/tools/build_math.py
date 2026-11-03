#!/usr/bin/env python3
"""Builds the full mathematics subject map (skill list, age 5 to PhD) + an invented example learner from src*.txt.
Outputs: ../data/math-skills.json (+ copy in /workspace/ai-tutor/data), ../data/math-skills.js, ../data/math-learner.js, research/math-skill-list.md"""
import re, json, hashlib, sys, collections, os
HERE=os.path.dirname(os.path.abspath(__file__)); OUT=os.path.join(HERE,'..','data'); ROOT='/workspace/ai-tutor'
BANDS=[ # id, code in src, name, zone, typical age (years), short label
 ('k','K','Kindergarten','foundations','5–6'),('g1','1','Grade 1','foundations','6–7'),('g2','2','Grade 2','foundations','7–8'),
 ('g3','3','Grade 3','foundations','8–9'),('g4','4','Grade 4','foundations','9–10'),('g5','5','Grade 5','foundations','10–11'),
 ('g6','6','Grade 6','foundations','11–12'),('g7','7','Grade 7','foundations','12–13'),('g8','8','Grade 8','foundations','13–14'),
 ('alg1','A1','Algebra I','highschool','13–15'),('geo','GE','Geometry','highschool','14–16'),('alg2','A2','Algebra II','highschool','15–17'),
 ('pre','PC','Precalculus','highschool','16–18'),('ap','AP','AP Calculus & Statistics','highschool','17–18'),
 ('u1','U1','Undergraduate: lower division','undergrad','18–20'),('u2','U2','Undergraduate: upper division core','undergrad','19–21'),
 ('u3','U3','Undergraduate: advanced topics','undergrad','20–22'),
 ('m1','G1','Graduate core and qualifying topics','graduate','22–25'),('m2','G2','Advanced graduate specialties','graduate','24–28'),
 ('rf','R','Research frontier (MSC2020 areas)','graduate','26+')]
BAND_BY_CODE={b[1]:b for b in BANDS}; BIDX={b[0]:i for i,b in enumerate(BANDS)}
ZONES=[('foundations','Inner: Foundations (K–8)','TEKS Ch.111 Subch. A–B; CCSS K–8'),('highschool','Middle: High school and AP','TEKS Ch.111 Subch. C; CCSS HS; AP Precalculus, Calculus, Statistics'),
 ('undergrad','Outer: Undergraduate','MAA CUPM Curriculum Guide 2015'),('graduate','Oort cloud: Graduate and research','Graduate qualifying syllabi; MSC2020')]
DOMS=[('num','Number & Operations','#fbbf24','Number'),('ntc','Number Theory','#f59e0b','Number theory'),('alg','Algebra & Structure','#fb7185','Algebra'),('lin','Linear Algebra','#e879f9','Linear algebra'),
 ('fun','Functions & Precalculus','#a78bfa','Functions'),('cal','Calculus & Analysis','#60a5fa','Calculus'),('app','Applied & Computational','#2dd4bf','Applied'),('geo','Geometry, Measurement & Topology','#34d399','Geometry'),
 ('sta','Statistics & Probability','#a3e635','Statistics'),('dis','Discrete Math & Logic','#fb923c','Discrete'),('pro','Proof & Mathematical Practice','#94a3b8','Proof')]
TEKS={'k':'§111.2','g1':'§111.3','g2':'§111.4','g3':'§111.5','g4':'§111.6','g5':'§111.7','g6':'§111.26','g7':'§111.27','g8':'§111.28','alg1':'§111.39','geo':'§111.41','alg2':'§111.40','pre':'§111.42'}
ZS={'foundations':'Inner · K–8','highschool':'Middle · HS + AP','undergrad':'Outer · Undergrad','graduate':'Oort · Grad + research'}
SRC={'C':('CCSS','CCSS'),'AP':('AP','AP'),'CUPM':('CUPM','CUPM'),'Q':('QUAL','Qualifying exam'),'MSC':('MSC','MSC2020'),'T':('TEKS','TEKS')}
def slug(n):
    w=re.sub(r'[^a-z0-9 ]','',n.lower().replace('–',' ').replace('-',' ').replace('’',"'").replace("'",'')).split()
    stop={'and','the','of','a','to','in','with','for','by','from','using','on'}
    w=[x for x in w if x not in stop][:5]; return '_'.join(w) or 'skill'
strands=collections.OrderedDict(); items=[]; ids={}
def load(fn,rf=False):
    dom=None; st=None
    for ln in open(os.path.join(HERE,fn),encoding='utf8'):
        ln=ln.rstrip('\n')
        if not ln.strip() or ln.startswith('#'): continue
        if ln.startswith('@'):
            m=re.match(r'@(\w+) (\w+) "(.+)"',ln); dom,sid,sn=m.groups(); st=sid
            if sid not in strands: strands[sid]={'id':sid,'name':sn,'domain':dom}
            continue
        f=ln.split('|'); band=BAND_BY_CODE[f[0]]; it={'band':band[0],'name':f[1],'domain':dom,'strand':st,'refs':[],'pre':[],'id':None,'nodef':False}
        for x in f[2:]:
            if x.endswith(' ^'): x=x[:-2]; it['nodef']=True
            if x.startswith('='): it['id']=x[1:]
            elif x.startswith('<'): it['pre']+=x[1:].split(',')
            elif x=='^': it['nodef']=True
            elif x.startswith('@'): it['domain']=x[1:]
            elif re.match(r'^[A-Za-z]+:',x): it['refs'].append(x)
        if f[0]=='R':  # frontier src5: strand per domain
            it['strand']='rf_'+it['domain']; strands.setdefault(it['strand'],{'id':it['strand'],'name':'Research frontier','domain':it['domain']}); it['nodef']=True
        items.append(it)
for fn in ['src1.txt','src2.txt','src3.txt','src4.txt']: load(fn)
load('src5.txt')
# ids
for it in items:
    base=it['id'] or slug(it['name']); i=base; n=2
    while i in ids: i=base+str(n); n+=1
    it['id']=i; ids[i]=it
# prereq resolution: skill id, else strand id (-> latest item of that strand in an earlier-or-same band, not self, file order)
errs=[]
pos={id(it):k for k,it in enumerate(items)}
bystrand=collections.defaultdict(list)
for it in items: bystrand[it['strand']].append(it)
def resolve(tok,it):
    if tok in ids: return tok if ids[tok] is not it else None
    if tok in bystrand:
        c=[x for x in bystrand[tok] if x is not it and BIDX[x['band']]<=BIDX[it['band']] and (BIDX[x['band']]<BIDX[it['band']] or pos[id(x)]<pos[id(it)])]
        if c: return c[-1]['id']
    errs.append('unresolved prereq %s on %s'%(tok,it['id'])); return None
for it in items:
    pre=[]
    if not it['nodef']:
        prev=[x for x in bystrand[it['strand']] if pos[id(x)]<pos[id(it)]]
        if prev: pre.append(prev[-1]['id'])
    for t in it['pre']:
        r=resolve(t,it)
        if r and r not in pre: pre.append(r)
    it['prereqs']=pre
# kinds
PROC=re.compile(r'^(Add|Subtract|Multiply|Divide|Solve|Factor|Simplify|Round|Measure|Tell|Convert|Fluently|Compute|Graph|Evaluate|Differentiat|Gaussian|Write slope|Count objects|Count to|Count forward|Read and write|Skip|Compose|Transformations|Derivative rules|The chain|Antiderivatives|Implicit|Optimization|Related|Compare|Organize|Classify)')
for it in items:
    n=it['name']
    it['kind']=('practice' if it['strand'] in('practice','hsproof','proof') else 'inquiry-skill' if it['band']=='rf' else 'procedure' if PROC.match(n) else 'concept')
    it['fluencyMatters']=(it['kind']=='procedure' and BIDX[it['band']]<=BIDX['pre']) or 'fluent' in n.lower() or it['id'] in ('timestables','trigf','complete_square_quadratic_formula')
    sr=[];tags=[]
    if it['band'] in TEKS: sr.append('TEKS '+TEKS[it['band']]); tags.append('TEKS')
    for r in it['refs']:
        k,v=r.split(':',1); tag,lab=SRC[k]
        if k=='T': sr.append('TEKS '+v) if v!='process standards' else sr.append('TEKS process standards')
        elif k=='C': sr.append('CCSS '+v)
        elif k=='AP': sr.append('AP '+v)
        elif k=='CUPM': sr.append('CUPM: '+v)
        elif k=='Q': sr.append(v+' qualifying syllabus')
        elif k=='MSC': sr.append('MSC2020 '+v)
        if tag not in tags: tags.append(tag)
    it['standardRefs']=sr; it['sourceTags']=tags or ['SYNTHESIS']
bad=[i['id']+': '+i['name'] for i in items if len(i['name'])>72]
if bad: errs.append('names >72: '+'; '.join(bad))
# acyclic + no inward
for it in items:
    for p in it['prereqs']:
        if BIDX[ids[p]['band']]>BIDX[it['band']]: errs.append('inward prereq %s -> %s'%(p,it['id']))
if errs: print('\n'.join(errs)); 
if errs and '--force' not in sys.argv: sys.exit(1)
# --- output map
skills=[]
for it in items:
    o={'id':it['id'],'name':it['name'],'domain':it['domain'],'zone':BANDS[BIDX[it['band']]][3],'band':it['band'],'strand':it['strand'],'kind':it['kind'],
       'standardRefs':it['standardRefs'],'sourceTags':it['sourceTags'],'prereqs':[{'skill':p} for p in it['prereqs']]}
    if it['fluencyMatters']: o['masteryTraits']={'fluencyMatters':True}
    skills.append(o)
dom_out=[]
for d in DOMS:
    dom_out.append({'id':d[0],'name':d[1],'short':d[3],'hue':d[2],'strands':[{'id':s['id'],'name':s['name']} for s in strands.values() if s['domain']==d[0]]})
m={'schemaVersion':1,'id':'math','name':'Mathematics','hue':'#a78bfa',
 'frameworks':[
  {'name':'TEKS Mathematics (19 TAC Chapter 111)','url':'https://tea.texas.gov/laws-and-rules/texas-administrative-code/19-tac-chapter-111'},
  {'name':'Common Core State Standards for Mathematics (2010)','url':'https://learning.ccsso.org/wp-content/uploads/2022/11/Math_Standards1.pdf'},
  {'name':'AP Calculus AB/BC Course and Exam Description','url':'https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf'},
  {'name':'AP Precalculus','url':'https://apcentral.collegeboard.org/courses/ap-precalculus'},
  {'name':'AP Statistics','url':'https://apcentral.collegeboard.org/courses/ap-statistics'},
  {'name':'MAA CUPM Curriculum Guide to Majors in the Mathematical Sciences (2015)','url':'https://maa.org/resource/cupm-guide/'},
  {'name':'Harvard Mathematics qualifying exam syllabus','url':'https://www.math.harvard.edu/graduate/study-the-qualifying-exam/the-qualifying-exam-syllabus/'},
  {'name':'Mathematics Subject Classification 2020 (MSC2020)','url':'https://msc2020.org/MSC_2020.pdf'}],
 'levelModel':{'kind':'course-sequence','zones':[{'id':z[0],'name':z[1],'short':ZS[z[0]],'standardRef':z[2]} for z in ZONES],
  'bands':[{'id':b[0],'name':b[2],'zone':b[3],'typicalAge':b[4]} for b in BANDS]},
 'domains':dom_out,'skills':skills,
 'layoutHints':{'domainOrder':[d[0] for d in DOMS],'style':'domain-sectors-by-band','denseThreshold':150,'fog':True}}
os.makedirs(OUT,exist_ok=True)
js=json.dumps(m,ensure_ascii=False,indent=1)
open(os.path.join(OUT,'math-skills.json'),'w',encoding='utf8').write(js)
open(ROOT+'/data/math-skills.json','w',encoding='utf8').write(js)
open(os.path.join(OUT,'math-skills.js'),'w',encoding='utf8').write('/* generated by tools/build_math.py */\nwindow.SG_MATH='+json.dumps(m,ensure_ascii=False,separators=(',',':'))+';\n')
# --- example learner (invented, deterministic): age 16-17, mastered through Algebra II, working in Precalculus
def h(s,salt=''):
    return int(hashlib.md5((s+salt).encode()).hexdigest()[:8],16)/0xFFFFFFFF
def rng(s,salt,lo,hi): return lo+(hi-lo)*h(s,salt)
L={}; order=sorted(range(len(items)),key=lambda k:(BIDX[items[k]['band']],k))
def R_of(t,S): return (1+(19/81)*t/S)**-0.5
for k in order:
    it=items[k]; i=it['id']; b=it['band']; bi=BIDX[b]
    pm=all(L[p]['m']>=.55 for p in it['prereqs'] if p in L) if it['prereqs'] else True
    if bi<=BIDX['alg2']:
        old=bi<=BIDX['g5']
        p=rng(i,'p',.955,.995); days=int(rng(i,'d',60,420) if old else rng(i,'d',20,180) if bi<=BIDX['alg1'] else rng(i,'d',3,70))
        S=__import__('math').exp(rng(i,'S',__import__('math').log(25),__import__('math').log(900)))
        R=max(.64,R_of(days,S)); span=int(days+rng(i,'sp',200,1500))
        if bi>=BIDX['alg2']: R=max(R,.9)
        st='done'
    elif b=='pre':
        sl=[x for x in items if x['strand']==it['strand'] and x['band']=='pre']; j=sl.index(it); n=len(sl)
        q=rng(it['strand'],'q',.3,.8); pos=(j+.5)/n
        if not pm: p=0;R=None;days=None;span=0;st='locked'
        elif pos<q*.5: p=rng(i,'p',.62,.95);days=int(rng(i,'d',4,40));R=R_of(days,rng(i,'S',30,120));span=int(rng(i,'sp',20,70));st='prog'
        elif pos<q*.8: p=rng(i,'p',.32,.55);days=int(rng(i,'d',1,14));R=R_of(days,40);span=int(rng(i,'sp',7,30));st='prog'
        elif pos<q: p=rng(i,'p',.13,.28);days=int(rng(i,'d',0,7));R=R_of(days,30);span=int(rng(i,'sp',2,12));st='prog'
        else: p=0;R=None;days=None;span=0;st='avail'
    elif b=='ap' and i=='limits': p=.16;R=.97;days=2;span=6;st='early'
    else: p=0;R=None;days=None;span=0;st='none'
    # early research opening: ap limits
    m_eff=(p*R) if R else 0.0
    L[i]={'m':m_eff,'p':p,'R':R,'days':days,'span':span}
# if p*R missed solid in done bands for some, fine (they become 'solid' + review).  Dimensions:
for it in items:
    i=it['id']; r=L[i]; p=r['p']; R=r['R']
    if not R or p<.1: continue
    mm=r['m']
    if mm>=.85: u=rng(i,'u',.72,.97); t=rng(i,'t',.62,.93)
    elif mm>=.55: u=rng(i,'u',.45,.80); t=rng(i,'t',.20,.58)
    elif mm>=.30: u=rng(i,'u',.20,.50); t=rng(i,'t',.02,.28)
    else: u=rng(i,'u',.03,.2); t=rng(i,'t',0,.08)
    if it['fluencyMatters']:
        bi=BIDX[it['band']]
        f=rng(i,'f',.82,1.0) if (mm>=.85 and bi<=BIDX['g6']) else rng(i,'f',.55,.9) if mm>=.85 else rng(i,'f',.35,.75) if mm>=.55 else rng(i,'f',.1,.45) if mm>=.30 else rng(i,'f',0,.15)
    else: f=None
    r['u']=u; r['f']=f; r['t']=t
# deliberate contrast cases so the mastery layers tell different stories (p, R, understand, fluency, transfer)
OVR={'timestables':(.99,.97,.92,.98,.90),'divide_fractions_fractions':(.92,.72,.38,.93,.40),'complete_square_quadratic_formula':(.95,.90,.55,.90,.45),
     'complex_numbers_arithmetic':(.97,.95,.88,.35,.64),'lin1':(.98,.97,.90,.96,.88)}
for k,(p_,R_,u_,f_,t_) in OVR.items():
    r=L[k]; r['p']=p_; r['R']=R_; r['m']=p_*R_; r['u']=u_; r['f']=f_; r['t']=t_
    if r['days'] is None or R_<.8: r['days']=max(r['days'] or 0,150)
# a few narrative touches: times tables fluent, finger-counting trace on addfacts? (still fluent now)
learner={'name':'Example learner (invented)','age':'16–17','profile':'Mastered through Algebra II; working in Precalculus; has just opened AP Calculus limits early.','skills':{}}
for it in items:
    r=L[it['id']]
    if not r['R']: continue
    learner['skills'][it['id']]=[round(r['p'],3),round(r['R'],3),r['days'],round(r['u'],2),(None if r['f'] is None else round(r['f'],2)),round(r['t'],2),r['span']]
open(os.path.join(OUT,'math-learner.js'),'w',encoding='utf8').write('/* generated: invented example learner [know p, retention R, days since evidence, understand, fluency|null, transfer, span days] */\nwindow.SG_MATH_LEARNER='+json.dumps(learner,ensure_ascii=False,separators=(',',':'))+';\n')
# --- report
def st_of(mm,pm):
    return 'mastered' if mm>=.85 else 'solid' if mm>=.55 else 'learning' if mm>=.3 else 'started' if mm>=.1 else None
cnt=collections.Counter(st_of(L[i['id']]['m'],1) or 'none' for i in items)
print('skills',len(items),'domains',len(DOMS),'strands',len(strands),'bands',len(BANDS)); print('learner state counts',dict(cnt))
review=sum(1 for i in items if L[i['id']]['R'] and L[i['id']]['R']<.75 and L[i['id']]['m']>=.1); print('review cues',review)
json.dump({'items':[{k:v for k,v in it.items() if k in('id','name','band','domain','strand','kind','standardRefs','sourceTags','prereqs','fluencyMatters')} for it in items],'strands':list(strands.values())},open('/tmp/math_items.json','w'),ensure_ascii=False)
