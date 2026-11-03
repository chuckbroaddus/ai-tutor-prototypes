// Generates spanish.subject-map.example.json from the prototype's Spanish sketch (EXAMPLE, ACTFL-shaped).
import fs from 'node:fs';
global.window=global;global.document={};global.matchMedia=()=>({matches:false});
await import('./sg-core.js');SG.compute&&SG.compute();
const u=SG.sub.span;
const dom={s_greet:'interpersonal',s_ask:'interpersonal',s_conv:'interpersonal',s_listen:'interpretive',s_read:'interpretive',s_news:'interpretive',s_write:'presentational',s_descr:'presentational',s_narr:'presentational',s_connect:'interpersonal',s_vocab:'language-system',s_pres:'language-system',s_ser:'language-system',s_past:'language-system',s_imperf:'language-system',s_culture:'cultures'};
const zones=['novice-mid','novice-high','intermediate-low','intermediate-mid','intermediate-high'];
const map={schemaVersion:1,id:'spanish',name:'Spanish',
 frameworks:[{name:'ACTFL Proficiency Guidelines',version:'2024',url:'https://www.actfl.org/news/revised-actfl-proficiency-guidelines-released'},{name:'ACTFL World-Readiness Standards (modes of communication, Cultures)',url:'https://www.actfl.org/educator-resources/world-readiness-standards-for-learning-languages'},{name:'TEKS Languages Other Than English (19 TAC Chapter 114)',url:'https://tea.texas.gov/laws-and-rules/texas-administrative-code/19-tac-chapter-114'}],
 levelModel:{kind:'proficiency-scale',zones:u.tiers.map((n,i)=>({id:zones[i],name:n})),zoneGates:[{zone:'intermediate-low',minShareSolidOfPreviousZone:0.7},{zone:'intermediate-mid',minShareSolidOfPreviousZone:0.7}]},
 domains:[{id:'interpretive',name:'Interpretive (listening, reading)'},{id:'interpersonal',name:'Interpersonal (conversation)'},{id:'presentational',name:'Presentational (speaking, writing)'},{id:'language-system',name:'Vocabulary and grammar'},{id:'cultures',name:'Cultures'}],
 skills:u.skills.map(s=>({id:s.id,name:s.name.replace(/ \((interpretive|interpersonal|presentational)\)/,''),domain:dom[s.id],zone:zones[s.tier],kind:/\(|Understand|Ask|Greet|Read|Write|Describe|Narrate|Connected/.test(s.name)?'can-do':'concept',
   prereqs:s.pre.map(p=>({skill:p,strength:'hard'}))}))};
fs.writeFileSync('spanish.subject-map.example.json',JSON.stringify(map,null,1));
console.log('wrote',map.skills.length,'skills');
