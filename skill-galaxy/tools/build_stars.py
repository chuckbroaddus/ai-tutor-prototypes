# Builds data/math-stars.json + data/math-stars.js: the "star layer" of the Math map used by prototype D (04-clusters.html).
# A star = a coherent group of skills (its planets). Stars have their own prerequisite graph and an unlock rule.
import json,collections,re
D=json.load(open('../data/math-skills.json'))
S=D['skills'];bands=[b['id'] for b in D['levelModel']['bands']];bi={b:i for i,b in enumerate(bands)}
UNLOCK=0.60   # a star unlocks when every prerequisite star has >= 60% of its skills Solid (p_known >= .55)
DONE=0.90     # a star counts as mastered (collapses into the meta-cluster) when >= 90% of its skills are >= .85
# id, name, short, zone, x, y, prereqs, blurb
ST=[
 ('count','Counting & adding','Counting','foundations',0,0,[],'Counting, place value, adding and subtracting (K to Grade 4)'),
 ('muldiv','Multiply, divide & factors','Multiply','foundations',1,0,['count'],'Multiplication, division, factors and patterns'),
 ('shapes','Shapes & measurement','Shapes','foundations',1,-1.1,['count'],'Shapes, lengths, area and volume (K to Grade 8)'),
 ('data','Data & probability, K to 8','Data K–8','foundations',1,1.1,['count'],'Graphs, averages and first probability'),
 ('fracs','Fractions, decimals & ratios','Fractions','foundations',2,0,['muldiv'],'Fractions, decimals, percent, ratios and rates'),
 ('prealg','Pre-algebra','Pre-algebra','foundations',3,0,['fracs'],'Integers, rational numbers, expressions and equations'),
 ('alg1','Algebra I','Algebra I','highschool',4,0,['prealg'],'Linear and quadratic equations, polynomials, functions'),
 ('geo','Geometry','Geometry','highschool',5,-1.1,['alg1','shapes'],'Proof, congruence, similarity, circles, trigonometry basics'),
 ('alg2','Algebra II','Algebra II','highschool',5,0,['alg1'],'Polynomial, rational, exponential and logarithmic functions, complex numbers'),
 ('stat','Statistics & probability','Statistics','highschool',5,1.1,['alg1','data'],'Distributions, inference, probability models'),
 ('pre','Precalculus','Precalculus','highschool',6,0,['alg2','geo'],'Functions, trigonometry, vectors and matrices, series'),
 ('discrete','Discrete math & proof','Discrete','undergrad',6,1.65,['alg2'],'Counting, logic, sets, graphs and proof writing'),
 ('apcalc','AP Calculus','Calculus','highschool',7,0,['pre'],'Limits, derivatives, integrals, series (AB and BC)'),
 ('linalg','Linear algebra','Linear algebra','undergrad',7,-1.1,['pre'],'Systems, vector spaces, eigenvalues'),
 ('mvde','Multivariable & differential equations','Multivar & DEs','undergrad',8,0.55,['apcalc'],'Vector calculus, ODEs, PDE ideas'),
 ('analysis','Analysis & topology','Analysis','undergrad',8,-0.55,['apcalc','discrete'],'Real and complex analysis, metric spaces, differential geometry, topology'),
 ('abstract','Abstract algebra & number theory','Abstract algebra','undergrad',8,-1.65,['linalg','discrete'],'Groups, rings, fields, number theory'),
 ('probapp','Probability, statistics & applied','Prob & applied','undergrad',9,0.55,['mvde','stat'],'Probability theory, statistics, numerical methods'),
 ('gstruct','Graduate: algebra, geometry & topology','Grad structures','graduate',9,-1.1,['abstract','analysis'],'Qualifying-exam algebra, geometry and topology'),
 ('ganal','Graduate: analysis, probability & applied','Grad analysis','graduate',10,0.55,['analysis','probapp'],'Qualifying-exam analysis, probability and PDE'),
 ('rfpure','Frontier: algebra, geometry & logic','Frontier A','graduate',10,-1.1,['gstruct'],'MSC2020 areas: algebra, number theory, geometry, logic, discrete'),
 ('rfanal','Frontier: analysis, applied & statistics','Frontier B','graduate',11,0.55,['ganal'],'MSC2020 areas: analysis, applied mathematics, statistics'),
]
ids=[s[0] for s in ST]
def star_of(k):
    d,st,b=k['domain'],k['strand'],bi[k['band']]
    if b==19: return 'rfpure' if d in('alg','ntc','lin','dis','pro','geo') else 'rfanal'
    if b in(17,18): return 'gstruct' if d in('alg','ntc','geo','lin','dis','pro') else 'ganal'
    if 14<=b<=16:
        if st in('multi','ode'): return 'mvde'
        if st in('real','cx'): return 'analysis'
        if d=='lin': return 'linalg'
        if d in('dis','pro'): return 'discrete'
        if d in('alg','ntc'): return 'abstract'
        if d=='geo': return 'analysis'
        return 'probapp'
    if st=='hsstat': return 'stat'
    if st in('data','prob'): return 'data'
    if st in('shapes','measure'): return 'shapes'
    if b==13: return 'apcalc'
    if st in('fractions','decimals','ratio'): return 'fracs'
    if st in('rational','exprs'): return 'prealg'
    if st in('multdiv','factors'): return 'muldiv'
    if st in('count','addsub','place'): return 'count'
    if b==8 and d=='fun': return 'alg1'
    # everything else by level: patterns, practices, HS course skills
    byb={0:'count',1:'count',2:'count',3:'count',4:'muldiv',5:'muldiv',6:'prealg',7:'prealg',8:'prealg',9:'alg1',10:'geo',11:'alg2',12:'pre'}
    return byb[b]
A={}
for k in S: A[k['id']]=star_of(k)
cnt=collections.Counter(A.values())
L=json.load(open('../data/math-learner-raw.json')) if False else None
DOM={'count':'num','muldiv':'num','fracs':'num','prealg':'num','shapes':'geo','geo':'geo','data':'sta','stat':'sta','probapp':'sta','alg1':'alg','alg2':'alg','abstract':'alg','gstruct':'alg','rfpure':'alg','pre':'fun','apcalc':'cal','mvde':'cal','analysis':'cal','ganal':'cal','rfanal':'cal','linalg':'lin','discrete':'dis'}
HUE={d['id']:d['hue'] for d in D['domains']}
out={'schemaNote':'Star layer for prototype D. unlock = share of each prerequisite star at Solid; done = share at Mastered-level knowledge.','unlockShare':UNLOCK,'doneShare':DONE,
 'zones':{z['id']:z['name'] for z in D['levelModel']['zones']},
 'stars':[{'id':s[0],'name':s[1],'short':s[2],'zone':s[3],'x':s[4],'y':s[5],'prereqs':s[6],'blurb':s[7],'domain':DOM[s[0]],'hue':HUE[DOM[s[0]]],'skills':[k['id'] for k in S if A[k['id']]==s[0]]} for s in ST]}
for s in out['stars']: assert s['skills'],s['id']
assert all(p in ids for s in out['stars'] for p in s['prereqs'])
# acyclic check
seen={}
def depth(i):
    if i in seen: return seen[i]
    seen[i]=0
    d=1+max([depth(p) for p in next(s for s in out['stars'] if s['id']==i)['prereqs']]+[-1]);seen[i]=d;return d
for i in ids: depth(i)
json.dump(out,open('../data/math-stars.json','w'),ensure_ascii=False,indent=1)
open('../data/math-stars.js','w').write('window.SG_MATH_STARS='+json.dumps(out,ensure_ascii=False)+';')
print({s['id']:len(s['skills']) for s in out['stars']},len(S),sum(len(s['skills']) for s in out['stars']))
