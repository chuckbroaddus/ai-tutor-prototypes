/* Prototype E data model: subject = star, domain = planet, topic = moon, subtopic (skill) = moonlet. Built from SG.SK after sg-core + sg-dense. EXAMPLE DATA.
   Orbit order = median course level (band) of a domain's skills, ties by mean prerequisite depth (pure depth put Proof and Discrete innermost because they hold K-8 practice skills).
   Math: 11 domains -> planets, 47 strands -> moons (topics), 536 skills -> moonlets. The file has no deeper level, so there is no level below skill.
   Other subjects have only tier -> skill, so a tier becomes a planet and each skill a moon (skill moons, no moonlets). */
(function(){
var TH=SG.TH,SK=SG.SK,by=SG.by;
var A='_ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/* ---- Estimated hours to master (PLACEHOLDER ESTIMATES: the data has no time field) ----
   hrs(skill) = (learner-effort hours of the course unit the skill belongs to) x (skill weight / sum of weights in that unit), so a unit's skills always add up to the unit's hours.
   Course-unit hours (effort = class time + practice):
   - K-8 grade (math bands k..g8): 190 h. Class time ~150 h = 50 min/day x 180 days (a placeholder share of the day); Texas requires >= 75,600 operational minutes/yr = 180 x 420 min (TEC 25.081, https://statutes.capitol.texas.gov/GetStatute.aspx?Code=ED&Value=25.081, retrieved 2026-10-29). +25% practice.
   - High-school course (alg1, geo, alg2, pre): 180 h = Carnegie unit 120 class hours (https://www.carnegiefoundation.org/what-is-the-carnegie-unit/ and NCES https://nces.ed.gov/StatProg/handbook/hsts.asp, retrieved 2026-10-29) + 50% practice. AP band = 2 courses (AP Calculus + AP Statistics) = 360 h.
   - College 3-credit course: 135 h = 3 credits x 15 wk x (1 h class + 2 h out-of-class), the federal credit-hour floor (34 CFR 600.2, https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-600/subpart-A/section-600.2, retrieved 2026-10-29). Bands: u1, u2 = 3 courses each; u3, m1, m2, rf = 2 each (placeholder course counts).
   - Other subjects (tier only, no band): each tier = one 180 h course unit. Spanish: 240 h per tier (5 tiers = ~1,200 h): US State Dept NFATC Category I, Spanish 30 wk x (23 class + 17 self-study h) = ~1,200 h to ILR 3 (https://www.state.gov/national-foreign-affairs-training-center/foreign-language-training, retrieved 2026-10-29).
   Skill weight = kind weight (procedure 1, practice .6, concept 1.2, inquiry-skill 1.5) x (1 + .15 x min(#prerequisites, 3)). Per-skill result clamped to 0.5..90 h. */
var BAND_H={k:190,g1:190,g2:190,g3:190,g4:190,g5:190,g6:190,g7:190,g8:190,alg1:180,geo:180,alg2:180,pre:180,ap:360,u1:405,u2:405,u3:270,m1:270,m2:270,rf:270},KW={procedure:1,practice:.6,concept:1.2,'inquiry-skill':1.5};
function assignHours(){var G={};SK.forEach(function(s){var k=s.subj==='math'?'m:'+s.band:s.subj+':'+s.tier;(G[k]=G[k]||[]).push(s)});
 Object.keys(G).forEach(function(k){var L=G[k],s0=L[0],tot=s0.subj==='math'?(BAND_H[s0.band]||180):s0.subj==='span'?240:180;
  var w=L.map(function(s){return (KW[s.kind]||1)*(1+.15*Math.min((s.pre||[]).length,3))}),sw=w.reduce(function(a,b){return a+b},0);
  L.forEach(function(s,i){s.hrs=Math.max(.5,Math.min(90,tot*w[i]/sw))})})}
assignHours();
function sumH(L){return L.reduce(function(a,s){return a+s.hrs},0)}
var GMIN=12,ACTIVE_LO=.10,ACTIVE_HI=TH.mastered;   // placeholder rule: a skill is "in progress" while p_known is between 10% and 85%
function hs(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967296}
function know(s){return SG.knowOf(s)}
var memo={};function depth(s,seen){if(memo[s.id])return memo[s.id];seen=seen||{};if(seen[s.id])return 1;seen[s.id]=1;var d=1;s.pre.forEach(function(p){if(by[p])d=Math.max(d,1+depth(by[p],seen))});delete seen[s.id];memo[s.id]=d;return d}
function stats(L){
 var o={n:L.length,solid:0,mast:0,active:0,started:0,sk:0,mm:0,u:[0,0],f:[0,0],t:[0,0],fr:[0,0]};
 L.forEach(function(s){var k=know(s);o.sk+=k;o.mm+=s.m;if(k>=TH.solid)o.solid++;if(k>=TH.mastered)o.mast++;if(k>=TH.started)o.started++;if(k>=ACTIVE_LO&&k<ACTIVE_HI)o.active++;
  if(k>=TH.started){var d=SG.dimsOf(s);if(d)['u','f','t'].forEach(function(c){if(d[c]!=null){o[c][0]+=d[c];o[c][1]++}});if(s.fresh!=null){o.fr[0]+=s.fresh;o.fr[1]++}}});
 o.share=o.n?o.solid/o.n:0;o.know=o.n?o.sk/o.n:0;o.mAvg=o.n?o.mm/o.n:0;['u','f','t','fr'].forEach(function(c){o[c+'v']=o[c][1]?o[c][0]/o[c][1]:null});o.done=o.n>0&&o.mast/o.n>=.9;o.on=o.n===1?o.active>0:(o.started>0&&!o.done); // placeholder rule: a topic/domain/subject is in progress once begun and until 90% of its skills are mastered; a single skill is in progress between 10% and 85%
 
 return o}
function medBand(L){var a=L.map(function(s){return s.tier}).sort(function(x,y){return x-y});return a.length?a[a.length>>1]:0}
function meanDepth(L){return L.length?L.reduce(function(a,s){return a+depth(s)},0)/L.length:0}
function byDepth(a,b){return a.depth-b.depth||(a.name<b.name?-1:1)}
var ANCH={math:[0,0],chem:[1750,-120],span:[-1800,260],phys:[-720,1180],bio:[900,1230],eng:[-1330,-1140],hist:[430,-1230]};
var systems=SG.SUBJ.map(function(u,ui){
 var P=[];
 if(u.dense){
  u.domains.forEach(function(d){
   var all=SK.filter(function(s){return s.subj===u.id&&s.domain===d.id}),M=d.strands.map(function(st){
    var L=SK.filter(function(s){return s.subj===u.id&&s.domain===d.id&&s.strand===st.id}).sort(function(a,b){return depth(a)-depth(b)||a.tier-b.tier});
    return{id:u.id+':'+d.id+':'+st.id,name:st.name,skills:L,asts:L,depth:medBand(L)+meanDepth(L)/1000,stats:stats(L),hrs:sumH(L)}}).filter(function(m){return m.skills.length}).sort(byDepth);
   P.push({id:u.id+':'+d.id,name:d.name,short:d.short,hue:d.hue,moons:M,skills:all,depth:medBand(all)+meanDepth(all)/1000,band:medBand(all),stats:stats(all),hrs:sumH(all)})});
 }else{
  u.tiers.forEach(function(tn,ti){var L=SK.filter(function(s){return s.subj===u.id&&s.tier===ti});if(!L.length)return;
   var M=L.map(function(s){return{id:s.id,name:s.name,skills:[s],asts:[],skill:s,depth:depth(s),stats:stats([s]),hrs:s.hrs}}).sort(byDepth);
   P.push({id:u.id+':t'+ti,name:tn,short:tn,hue:u.color,moons:M,skills:L,depth:ti+1,tier:ti,stats:stats(L),hrs:sumH(L)})})}
 P.sort(byDepth);P.forEach(function(p,i){p.i=i;p.th=hs(p.id)*6.283;p.moons.forEach(function(m,j){m.j=j;m.th=hs(m.id)*6.283;m.tilt=(hs(m.id+'t')-.5)*.5;m.asts.forEach(function(s,k){s._k=k;s._th=hs(s.id)*6.283});m.planet=p});p.sys=null});
 /* Course-band groups (math only, data-derived): a moon with >=12 skills spanning >=2 course bands gets one group per band (ordered by band). Groups sit between moon and skill: skills orbit their group, groups orbit the moon. */
 P.forEach(function(p){p.moons.forEach(function(m){m.groups=null;if(m.asts.length<GMIN)return;var T={};m.asts.forEach(function(s){(T[s.tier]=T[s.tier]||[]).push(s)});var ks=Object.keys(T).map(Number).sort(function(a,b){return a-b});if(ks.length<2)return;
  m.groups=ks.map(function(t,j){var L=T[t],bd=window.SG_MATH.levelModel.bands[t];return{id:m.id+':'+bd.id,name:bd.name,band:bd.id,tier:t,j:j,skills:L,asts:L,n:L.length,th:hs(m.id+':'+bd.id)*6.283,moon:m,stats:stats(L),hrs:sumH(L)}});
  m.groups.forEach(function(g){g.skills.forEach(function(s){s._grp=g})})})});
 var n=P.length,sys={id:u.id,name:u.name,color:u.color,u:u,planets:P,n:n,skills:SK.filter(function(s){return s.subj===u.id}),pos:ANCH[u.id]||[0,0],
  step:n>=9?33:n>=4?46:60,note:u.note,attrs:u.attrs};
 sys.stats=stats(sys.skills);sys.hrs=sumH(sys.skills);sys.R0=130;sys.Rmax=sys.R0+(n-1)*sys.step;P.forEach(function(p){p.sys=sys;p.R=sys.R0+p.i*sys.step});
 sys.hasAsts=P.some(function(p){return p.moons.some(function(m){return m.asts.length})});
 return sys});
var S={systems:systems,by:{},planet:{},moon:{},ACTIVE_LO:ACTIVE_LO,ACTIVE_HI:ACTIVE_HI,depth:depth,stats:stats,skillLoc:{}};
systems.forEach(function(y){S.by[y.id]=y;y.planets.forEach(function(p){S.planet[p.id]=p;p.moons.forEach(function(m){S.moon[m.id]=m;if(m.skill)S.skillLoc[m.skill.id]={sys:y,planet:p,moon:m};m.asts.forEach(function(s){S.skillLoc[s.id]={sys:y,planet:p,moon:m}})})})});
var HM={star:0,planet:0,moon:0,smoon:0,group:0,ast:0};
systems.forEach(function(y){HM.star=Math.max(HM.star,y.hrs);y.planets.forEach(function(p){HM.planet=Math.max(HM.planet,p.hrs);p.moons.forEach(function(m){if(m.skill)HM.smoon=Math.max(HM.smoon,m.hrs);else HM.moon=Math.max(HM.moon,m.hrs);(m.groups||[]).forEach(function(g){HM.group=Math.max(HM.group,g.hrs)});m.asts.forEach(function(s){HM.ast=Math.max(HM.ast,s.hrs)})})})});
S.HM=HM;S.hoursNote='Estimated hours to master are PLACEHOLDERS. Method: a course unit\'s effort hours (K-8 year 190 h, HS course 180 h from the Carnegie unit, college 3-credit course 135 h from the federal credit hour, Spanish tier 240 h from State Dept FSI timelines) are shared among its skills by kind and prerequisite count.';
SG.SOL=S;
})();
