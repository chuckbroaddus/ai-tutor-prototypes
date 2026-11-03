import json,collections,datetime
d=json.load(open('data/math-skills.json'))
S=d['skills'];LM=d['levelModel'];DOM={x['id']:x for x in d['domains']}
ST={}
for x in d['domains']:
    for s in x['strands']: ST[s['id']]=s['name']
Z={z['id']:z for z in LM['zones']};B={b['id']:b for b in LM['bands']}
bo=[b['id'] for b in LM['bands']];zo=[z['id'] for z in LM['zones']];do=[x['id'] for x in d['domains']]
n=len(S);edges=sum(len(s.get('prereqs',[])) for s in S)
cz=collections.Counter(s['zone'] for s in S);cb=collections.Counter(s['band'] for s in S);cd=collections.Counter(s['domain'] for s in S)
cx=collections.Counter((s['zone'],s['domain']) for s in S);ck=collections.Counter(s['kind'] for s in S)
tags=collections.Counter(t for s in S for t in s['sourceTags'])
fl=sum(1 for s in S if s.get('masteryTraits',{}).get('fluencyMatters'))
o=[]
o.append(f"# Complete mathematics skill list, age 5 to PhD\n\nGenerated {datetime.date.today()} by `site/skill-galaxy/tools/build_math.py` + `make_md.py` from the source files `tools/src1..5.txt`. Machine-readable version: `data/math-skills.json` (validates against `subject-schema.json`). Local draft, not committed.\n")
o.append(f"## Totals\n\n- **{n} skills**, {len(DOM)} domains, {len(ST)} strands, {len(bo)} level bands, {len(zo)} orbit zones, **{edges} prerequisite edges** (default prerequisite = previous skill in the same strand; cross-strand edges added by hand; no cycles, no edge points from an inner zone to an outer one).\n- Granularity: one skill = one standards cluster or one textbook topic a tutor could teach and assess (for example *Divide fractions by fractions*, *Eigenvalues and eigenvectors*). It is a planning-level list, not an atom-level knowledge-component list; a real product would split each skill into 3 to 10 assessable sub-skills.\n- {fl} skills are tagged `fluencyMatters` (speed/automaticity is a meaningful goal, mostly K to Precalculus procedures and facts).\n- Skill kinds: "+", ".join(f"{k} {v}" for k,v in ck.most_common())+"\n- Sources tagged on skills: "+", ".join(f"{k} {v}" for k,v in tags.most_common())+" (a skill can carry several).\n")
o.append("## Counts by zone\n\n| Zone | Bands | Skills |\n|---|---|---|")
for z in zo: o.append(f"| {Z[z]['name']} | {', '.join(B[b]['name'] for b in bo if B[b]['zone']==z)} | {cz[z]} |")
o.append(f"| **Total** | 20 | **{n}** |\n")
o.append("## Counts by level band\n\n| Band | Zone | Typical age | Skills |\n|---|---|---|---|")
for b in bo: o.append(f"| {B[b]['name']} | {Z[B[b]['zone']]['short']} | {B[b]['typicalAge']} | {cb[b]} |")
o.append("")
o.append("## Counts by domain\n\n| Domain | Strands | Skills |\n|---|---|---|")
for x in do: o.append(f"| {DOM[x]['name']} | {len(DOM[x]['strands'])} | {cd[x]} |")
o.append("")
o.append("## Zone by domain\n\n| Domain | "+" | ".join(Z[z]['short'] for z in zo)+" | Total |\n|---|"+"---|"*(len(zo)+1))
for x in do: o.append(f"| {DOM[x]['short']} | "+" | ".join(str(cx[(z,x)]) for z in zo)+f" | {cd[x]} |")
o.append("| **Total** | "+" | ".join(f"**{cz[z]}**" for z in zo)+f" | **{n}** |\n")
o.append("## Sources and what each contributed\n\n"+"""| Zone | Source | URL |
|---|---|---|
| Inner K-8 | Texas Essential Knowledge and Skills, 19 TAC Chapter 111 (Subchapters A, B) | https://tea.texas.gov/laws-and-rules/texas-administrative-code/19-tac-chapter-111 |
| Inner K-8, HS | Common Core State Standards for Mathematics | https://learning.ccsso.org/wp-content/uploads/2022/11/Math_Standards1.pdf |
| Middle | TEKS Chapter 111 Subchapter C (Algebra I, Geometry, Algebra II, Precalculus) | same TEKS URL |
| Middle | AP Precalculus | https://apcentral.collegeboard.org/courses/ap-precalculus |
| Middle | AP Calculus AB/BC course and exam description | https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf |
| Middle | AP Statistics | https://apcentral.collegeboard.org/courses/ap-statistics |
| Outer | MAA CUPM Curriculum Guide to Majors in the Mathematical Sciences (2015) | https://maa.org/resource/cupm-guide/ |
| Oort (G1) | Graduate qualifying exam syllabi (Harvard; Stanford, Arizona and Rutgers pages also read) | https://www.math.harvard.edu/graduate/study-the-qualifying-exam/the-qualifying-exam-syllabus/ |
| Oort (R) | Mathematics Subject Classification 2020 (top-level classes) | https://msc2020.org/MSC_2020.pdf , https://zbmath.org/classification/ |
""")
o.append("## Reference codes on each skill\n\n`TEKS §111.x` = TEKS course or grade section (section level, not individual student expectation). `CCSS 4.NF`, `CCSS A-REI` = Common Core grade.domain or HS conceptual category cluster. `AP ...` = AP course. `CUPM: area` = MAA CUPM 2015 curriculum area. `Harvard ...` = Harvard qualifying exam syllabus item. `MSC2020 nn` = MSC2020 two-digit class. AP Statistics unit numbers are deliberately not given (could not be verified).\n")
o.append("## Caveats\n\n- Standards references are cluster or section level, not per-standard; each skill was written from the cited framework's scope and sequence, then grouped. Do an expert review before it drives a real curriculum.\n- Research-frontier skills (61) are the MSC2020 top-level classes except 00 General and 01 History; they are 'doorways', not teachable units yet.\n- Graduate skills tagged Qual are based only on the fetched syllabus pages; other departments differ.\n- Learner values in `data/math-learner.js` (age 16 to 17, mastered through Algebra II) are invented for the prototype.\n")
o.append("## Full list\n\nFormat: name — strand · kind · references. Prerequisite edges are omitted here; see the JSON for all 604 edges.\n")
nm={s['id']:s['name'] for s in S}
for z in zo:
    o.append(f"\n## {Z[z]['name']} ({cz[z]} skills)\n")
    for b in bo:
        if B[b]['zone']!=z: continue
        o.append(f"\n### {B[b]['name']} (age {B[b]['typicalAge']}, {cb[b]} skills)\n")
        for x in do:
            L=[s for s in S if s['band']==b and s['domain']==x]
            if not L: continue
            o.append(f"**{DOM[x]['name']}**\n")
            for s in L:
                o.append(f"- {s['name']} — {ST.get(s['strand'],s['strand'])} · {s['kind']}"+(" · fluency" if s.get('masteryTraits',{}).get('fluencyMatters') else "")+" · "+", ".join(s['standardRefs']))
            o.append("")
open('/workspace/ai-tutor/research/math-skill-list.md','w',encoding='utf8').write("\n".join(o))
print(n,edges,dict(cz),dict(cb),dict(cd),fl,ck,tags)
