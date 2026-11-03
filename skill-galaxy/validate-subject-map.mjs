// Minimal dependency-free validator for subject maps (structure rules the JSON Schema cannot express). Usage: node validate-subject-map.mjs file.json
import fs from 'node:fs';
const m=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),err=[];
const zones=new Set(m.levelModel.zones.map(z=>z.id)),doms=new Set(m.domains.map(d=>d.id)),ids=new Set();
if(m.schemaVersion!==1)err.push('schemaVersion must be 1');
m.skills.forEach(s=>{if(ids.has(s.id))err.push('duplicate id '+s.id);ids.add(s.id);if(!zones.has(s.zone))err.push(s.id+': unknown zone '+s.zone);if(!doms.has(s.domain))err.push(s.id+': unknown domain '+s.domain);if(s.name.length>72)err.push(s.id+': name too long')});
const zi=Object.fromEntries(m.levelModel.zones.map((z,i)=>[z.id,i]));
m.skills.forEach(s=>(s.prereqs||[]).forEach(p=>{if(!p.skill.includes(':')&&!ids.has(p.skill))err.push(s.id+': unknown prereq '+p.skill)}));
const col={};(function dfs(){const v=id=>{col[id]=1;const s=m.skills.find(k=>k.id===id);(s.prereqs||[]).filter(p=>(p.strength||'hard')==='hard'&&ids.has(p.skill)).forEach(p=>{if(col[p.skill]===1)err.push('cycle via '+id+' -> '+p.skill);else if(!col[p.skill])v(p.skill)});col[id]=2};m.skills.forEach(s=>{if(!col[s.id])v(s.id)})})();
const sk=Object.fromEntries(m.skills.map(s=>[s.id,s]));
m.skills.forEach(s=>(s.prereqs||[]).forEach(p=>{const q=sk[p.skill];if(q&&zi[q.zone]>zi[s.zone])err.push(s.id+': prerequisite '+q.id+' sits in an OUTER zone (map would draw an inward dependency)')}));
(m.levelModel.zoneGates||[]).forEach(g=>{if(!zones.has(g.zone))err.push('zoneGate unknown zone '+g.zone)});
const bands=(m.levelModel.bands||[]),bi=Object.fromEntries(bands.map((b,i)=>[b.id,i]));
if(bands.length){bands.forEach((b,i)=>{if(!zones.has(b.zone))err.push('band '+b.id+': unknown zone');if(i&&zi[b.zone]<zi[bands[i-1].zone])err.push('bands must be ordered inner to outer: '+b.id)});
 m.skills.forEach(s=>{if(!s.band)err.push(s.id+': band required when levelModel.bands is given');else if(!(s.band in bi))err.push(s.id+': unknown band '+s.band);else if(bands[bi[s.band]].zone!==s.zone)err.push(s.id+': band '+s.band+' is not in zone '+s.zone)});
 m.skills.forEach(s=>(s.prereqs||[]).forEach(p=>{const q=sk[p.skill];if(q&&q.band&&s.band&&bi[q.band]>bi[s.band])err.push(s.id+': prerequisite '+q.id+' is in an OUTER band')}))}
const sts=new Set((m.domains||[]).flatMap(d=>(d.strands||[]).map(x=>x.id)));
if(sts.size)m.skills.forEach(s=>{if(s.strand&&!sts.has(s.strand))err.push(s.id+': unknown strand '+s.strand)});
console.log(err.length?'INVALID\n'+err.join('\n'):'OK: '+m.skills.length+' skills, '+m.levelModel.zones.length+' zones, '+m.domains.length+' domains'+(bands.length?', '+bands.length+' bands':'')+', no cycles, no inward dependencies');
process.exit(err.length?1:0);
