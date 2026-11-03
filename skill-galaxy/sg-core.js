/* Skill Galaxy prototypes — shared EXAMPLE data + logic. All learner data here is invented for design review. */
(function(){
var TH={started:.10,learning:.30,solid:.55,mastered:.85};            // spec LM-014 thresholds; prerequisite gate = solid (KM-017)
var TIERCOL={mastered:'#3fb950',solid:'#58a6ff',learning:'#d29922',started:'#f0883e',available:'#e6edf3',locked:'#6e7681'}; // spec KM-010 palette
var TIERLABEL={mastered:'Mastered',solid:'Solid',learning:'Learning',started:'Started',available:'Ready to start',locked:'Locked'};
var TIERRANGE={mastered:'≥ 85% + gates',solid:'55–84%',learning:'30–54%',started:'10–29%',available:'prereqs met, < 10%',locked:'prereqs not met'};

var SUBJ=[
 {id:'math',name:'Math',color:'#a78bfa',cx:-1050,cy:0,a0:-60,y3:6,tiers:['Foundations','Algebra I','Geometry','Algebra II / Precalc','AP Calc & Stats'],
  attrs:[['Reasoning',61],['Computation',84],['Modeling',52],['Representation',70],['Communication',49]]},
 {id:'chem',name:'Chemistry',color:'#2dd4bf',cx:600,cy:60,a0:-120,y3:-5,tiers:['Foundations','Structure','Organic I','Reactions','Mastery tier'],
  attrs:[['Reasoning',72],['Quantitative',81],['Modeling',66],['Lab practice',48],['Communication',58]]},
 {id:'phys',name:'Physics',color:'#60a5fa',cx:-120,cy:900,a0:-90,y3:12,tiers:['Foundations','Mechanics','Energy & waves']},
 {id:'bio',name:'Biology',color:'#86efac',cx:1150,cy:900,a0:-110,y3:-12,tiers:['Foundations','Molecules','Systems']},
 {id:'eng',name:'English',color:'#f472b6',cx:-1250,cy:-1000,a0:60,y3:9,tiers:['Foundations','Analysis','Composition']},
 {id:'hist',name:'History',color:'#fbbf24',cx:-200,cy:-1050,a0:90,y3:-8,tiers:['Foundations','Eras','Analysis']},
 {id:'span',name:'Spanish',color:'#fb923c',cx:850,cy:-1000,a0:100,y3:7,tiers:['Novice Mid','Novice High','Intermediate Low','Intermediate Mid','Intermediate High'],
  attrs:[['Interpretive',68],['Interpersonal',51],['Presentational',47],['Cultures',44]],
  note:'Orbit zones are ACTFL proficiency sublevels (Proficiency Guidelines 2024), not courses. Skills are can-do tasks tagged by mode of communication.'}
];
// id|name|subject|tier|m_eff|freshness R|prereqs(csv, global ids)|days since evidence|flags (r = opened early by Research path)
var RAW=[
 'num|Number sense & integers|math|0|.97|.96||3',
 'frac|Fractions & decimals|math|0|.94|.62|num|34',
 'ratio|Ratios & proportions|math|0|.86|.90|frac|6',
 'expr|Expressions & order of operations|math|0|.92|.94|num|5',
 'lin1|Solving linear equations|math|1|.90|.92|expr|4',
 'linf|Linear functions & slope|math|1|.84|.90|lin1,ratio|7',
 'sys|Systems of linear equations|math|1|.66|.88|linf|3',
 'ineq|Linear inequalities|math|1|.71|.85|lin1|9',
 'expo|Exponent rules|math|1|.78|.70|expr|27',
 'quad1|Factoring & intro quadratics|math|1|.47|.90|expo,lin1|2',
 'cong|Congruence & transformations|math|2|.74|.90|lin1|8',
 'sim|Similarity & scale|math|2|.58|.90|ratio,cong|5',
 'proof|Geometric proof & reasoning|math|2|.31|.90|cong|4',
 'trig|Right-triangle trig ratios|math|2|.18|.95|sim,expo|1',
 'circ|Circles & arcs|math|2|0||sim|',
 'fnx|Function transformations|math|3|.22|.95|linf|2',
 'expl|Exponential functions|math|3|0||expo,linf|',
 'poly|Polynomials & quadratic formula|math|3|0||quad1|',
 'log|Logarithms|math|3|0||expl|',
 'trigf|Trig functions & unit circle|math|3|0||trig|',
 'stats|AP Statistics: data & inference|math|4|0||ratio,ineq|',
 'calc|AP Calculus: limits & derivatives|math|4|0||fnx,log,trigf,poly|',
 'atoms|Atoms & electrons|chem|0|.96|.95||12',
 'cov|Covalent bonding|chem|0|.92|.93|atoms|10',
 'lewis|Lewis structures|chem|0|.88|.66|atoms|31',
 'vsepr|VSEPR shape|chem|1|.81|.90|lewis,cov|9',
 'polar|Bond polarity|chem|1|.76|.92|cov|8',
 'imf|H-bonding & IMFs|chem|1|.64|.90|polar,vsepr|6',
 'sol|Solubility in water|chem|1|.66|.88|imf|5',
 'fg|Functional groups|chem|2|.70|.91|vsepr|4',
 'name|Naming alcohols (IUPAC)|chem|2|.58|.92|fg|3',
 'class|1° / 2° / 3° alcohols|chem|2|.45|.95|fg|2',
 'bp|Alcohol boiling points|chem|2|.52|.93|imf|5',
 'stoich|Stoichiometry|chem|3|.83|.90|atoms,ratio|7',
 'comb|Combustion of ethanol|chem|3|.60|.90|stoich,fg|6',
 'ferm|Fermentation|chem|3|.35|.95|comb,name|3',
 'ox|Oxidation of alcohols|chem|3|.22|.95|class|1|r',
 'ester|Esterification|chem|4|.05|.95|ox|',
 'ir|IR spectra: O–H stretch|chem|4|.08|.95|ox,bp|',
 'p_units|Units & measurement|phys|0|0||',
 'p_motion|Motion & graphs|phys|1|0||linf|',
 'p_forces|Forces & Newton’s laws|phys|1|0||p_motion|',
 'p_energy|Energy & work|phys|2|0||p_forces|',
 'p_waves|Waves & sound|phys|2|0||p_motion|',
 'b_cells|Cells & organelles|bio|0|0||',
 'b_memb|Membranes & transport|bio|1|0||b_cells|',
 'b_dna|DNA & genes|bio|1|0||b_cells|',
 'b_hered|Heredity & evolution|bio|2|0||b_dna|',
 'b_eco|Ecosystems|bio|2|0||b_cells|',
 'e_read|Reading comprehension|eng|0|0||',
 'e_theme|Main idea & theme|eng|1|0||e_read|',
 'e_arg|Argument & evidence|eng|1|0||e_read|',
 'e_essay|Essay structure|eng|2|0||e_arg|',
 'e_rhet|Rhetoric|eng|2|0||e_theme,e_arg|',
 'h_src|Timelines & sources|hist|0|0||',
 'h_cause|Causes & effects|hist|1|0||h_src|',
 'h_found|US founding era|hist|1|0||h_src|',
 'h_ind|Industrial era|hist|2|0||h_cause|',
 'h_prim|Analyzing primary sources|hist|2|0||h_found,h_cause|',
 's_greet|Greetings & introductions (interpersonal)|span|0|.95|.90||20',
 's_vocab|Core vocabulary: family, school, food|span|0|.90|.80||15',
 's_listen|Understand slow, simple speech (interpretive)|span|0|.88|.85||6',
 's_pres|Present tense, regular & common irregular|span|1|.84|.90|s_vocab|4',
 's_ser|Ser vs. estar|span|1|.70|.72|s_pres|18',
 's_read|Read short, familiar texts (interpretive)|span|1|.78|.88|s_vocab|7',
 's_ask|Ask & answer simple questions (interpersonal)|span|1|.66|.90|s_greet,s_listen|3',
 's_write|Write simple sentences & notes (presentational)|span|1|.60|.85|s_pres|5',
 's_culture|Cultural products & practices|span|2|.50|.90|s_read|10',
 's_past|Past tense: preterite|span|2|.42|.90|s_pres,s_ser|2',
 's_conv|Everyday conversation (interpersonal)|span|2|.33|.92|s_ask,s_pres|2',
 's_descr|Describe people, places, routines (presentational)|span|2|.15|.95|s_write|1',
 's_imperf|Imperfect vs. preterite|span|3|0||s_past|',
 's_narr|Narrate a past event (presentational)|span|3|0||s_past,s_write|',
 's_news|Read & discuss short articles (interpretive)|span|3|0||s_read|',
 's_connect|Connected discourse: opinions & reasons|span|4|0||s_conv,s_narr|'
];
var SK=RAW.map(function(r){var f=r.split('|');return{id:f[0],name:f[1],subj:f[2],tier:+f[3],m:+f[4],fresh:f[5]===''?null:+f[5],pre:f[6]?f[6].split(','):[],days:f[7]===''||f[7]==null?null:+f[7],research:f[8]==='r'}});
var FULLMATH=!!(window.SG_MATH_FULL&&window.SG_MATH&&window.SG_MATH_LEARNER);
if(FULLMATH){ // Prototype C only: swap the 22-skill sketch for the full age 5-to-PhD map + invented example learner (A and B keep the sketch)
 var M=window.SG_MATH,LN=window.SG_MATH_LEARNER.skills,bi={};M.levelModel.bands.forEach(function(b,i){bi[b.id]=i});
 SK=SK.filter(function(s){return s.subj!=='math'});
 M.skills.forEach(function(k){var l=LN[k.id],p=l?l[0]:0,R=l?l[1]:null;
  SK.push({id:k.id,name:k.name,subj:'math',tier:bi[k.band],band:k.band,zone:k.zone,domain:k.domain,strand:k.strand,m:l?p*R:0,p:p,fresh:R,pre:k.prereqs.map(function(x){return x.skill}),days:l?l[2]:null,research:false,
   refs:k.standardRefs||[],tags:k.sourceTags||[],kind:k.kind,fm:!!(k.masteryTraits&&k.masteryTraits.fluencyMatters),dim:l?{u:l[3],f:l[4],t:l[5],span:l[6]}:null})});
 var mu=SUBJ.filter(function(u){return u.id==='math'})[0];
 mu.name='Math';mu.dense=true;mu.tiers=M.levelModel.bands.map(function(b){return b.name});mu.bands=M.levelModel.bands;mu.zones=M.levelModel.zones;mu.domains=M.domains;mu.hints=M.layoutHints;mu.cx=0;mu.cy=0;mu.a0=-90;
 var mv={chem:[2750,-350],phys:[-350,2750],bio:[1950,2200],eng:[-2450,-1600],hist:[-120,-2750],span:[2080,-2080]};SUBJ.forEach(function(u){if(mv[u.id]){u.cx=mv[u.id][0];u.cy=mv[u.id][1]}});
 mu.note='Full mathematics map: '+M.skills.length+' skills in '+M.domains.length+' domain stars across 4 orbit zones (inner K–8, middle high school and AP, outer undergraduate, Oort graduate and research). Learner values are invented.';
}
var by={},sub={};SK.forEach(function(s){by[s.id]=s});SUBJ.forEach(function(s){sub[s.id]=s});
function kn(s){return s.p!=null?s.p:s.m} // prerequisites use what you KNOW (p_known), not the forgetting-decayed m_eff, so forgetting never re-locks a skill (KM-018)
function compute(){
 SK.forEach(function(s){s.dep=[]});
 SK.forEach(function(s){s.pre.forEach(function(p){by[p].dep.push(s.id)})});
 SK.forEach(function(s){
  s.needs=s.pre.map(function(p){var h=kn(by[p]);return{id:p,need:TH.solid,have:h,ok:h>=TH.solid}});
  s.prereqMet=s.needs.every(function(n){return n.ok});
  s.state=s.m>=TH.mastered?'mastered':s.m>=TH.solid?'solid':s.m>=TH.learning?'learning':s.m>=TH.started?'started':(s.prereqMet?'available':'locked');
  s.review=s.fresh!=null&&s.fresh<.75&&s.m>=TH.started;
  s.early=s.m>=TH.started&&!s.prereqMet;
  s.fog=!!(sub[s.subj].dense&&!(s.m>=TH.started||s.state==='available'||(s.state==='locked'&&s.needs.every(function(n){return kn(by[n.id])>=TH.started}))));
 });
 var E=[];SK.forEach(function(s){s.pre.forEach(function(p){var P=by[p];E.push({from:p,to:s.id,cross:P.subj!==s.subj,state:((s.prereqMet||s.early)&&kn(P)>=TH.solid)?(s.m>=TH.learning?'solid':'dashed'):'ghost',done:s.m>=TH.solid&&kn(P)>=TH.solid})})});
 SG.edges=E;
 SUBJ.forEach(function(u){var L=SK.filter(function(s){return s.subj===u.id});u.skills=L;u.count={};['mastered','solid','learning','started','available','locked'].forEach(function(k){u.count[k]=L.filter(function(s){return s.state===k}).length});
  u.mean=L.reduce(function(a,s){return a+s.m},0)/L.length;u.started=L.some(function(s){return s.m>=TH.started});u.review=L.filter(function(s){return s.review}).length;
  u.tierMax=Math.max.apply(null,L.map(function(s){return s.tier}))});
}
function ringR(t,u){return u&&u._R?u._R[t]:100+78*t}
function outerR(u){return ringR(u.tierMax,u)}
function labelAngle(u){if(u.dense)return-Math.PI/2;var A=u.skills.map(function(s){return((u._lp[s.id].a%(2*Math.PI))+2*Math.PI)%(2*Math.PI)}).sort(function(a,b){return a-b}),bg=-1,mid=0;
 for(var i=0;i<A.length;i++){var n=A[(i+1)%A.length]+(i===A.length-1?2*Math.PI:0),g=n-A[i];if(g>bg){bg=g;mid=A[i]+g/2}}
 var d=((mid*180/Math.PI)%360+360)%360;if(d>45&&d<135)d=d<90?40:140;return d*Math.PI/180}
function radius(s){return sub[s.subj].dense?3.6+4*s.m:9+9*s.m}
function layout(u){
 if(u.dense&&SG.layoutDense)return SG.layoutDense(u);
 var L=u.skills,pos={},a0=u.a0*Math.PI/180;
 function norm(a){while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a}
 for(var t=0;t<=u.tierMax;t++){
  var T=L.filter(function(s){return s.tier===t}),R=ringR(t),gap=Math.min(1.3,135/R),free=[],items=[];
  T.forEach(function(s){var ps=s.pre.filter(function(p){return pos[p]});
   if(!ps.length){free.push(s);return}
   var sx=0,sy=0;ps.forEach(function(p){sx+=Math.cos(pos[p].a);sy+=Math.sin(pos[p].a)});items.push({s:s,d:norm(Math.atan2(sy,sx)-a0)})});
  free.forEach(function(s,i){items.push({s:s,d:(i-(free.length-1)/2)*gap})});
  items.sort(function(a,b){return a.d-b.d});
  var mean=items.reduce(function(a,i){return a+i.d},0)/items.length,out=[];
  items.forEach(function(it,i){out[i]=i===0?it.d:Math.max(it.d,out[i-1]+gap)});
  var m2=out.reduce(function(a,v){return a+v},0)/out.length,mx=Math.max.apply(null,out.map(function(v){return Math.abs(v-(m2-mean))})),cf=mx>2.45?2.45/mx:1;
  var slots=out.map(function(v){return a0+(v-(m2-mean))*cf}),ord=items.map(function(it){return it.s});
  function place(){ord.forEach(function(s,i){var a=slots[i];pos[s.id]={a:a,r:R,x:R*Math.cos(a),y:R*Math.sin(a)}})}
  function cost(){var segs=[],c=0;L.forEach(function(s){if(!pos[s.id])return;s.pre.forEach(function(p){if(pos[p]&&by[p].subj===u.id)segs.push([pos[p],pos[s.id],p,s.id])})});
   function ccw(a,b,c2){return (c2.y-a.y)*(b.x-a.x)>(b.y-a.y)*(c2.x-a.x)}
   for(var i=0;i<segs.length;i++)for(var j=i+1;j<segs.length;j++){var A=segs[i],B=segs[j];if(A[2]===B[2]||A[3]===B[3]||A[2]===B[3]||A[3]===B[2])continue;
    if(ccw(A[0],B[0],B[1])!==ccw(A[1],B[0],B[1])&&ccw(A[0],A[1],B[0])!==ccw(A[0],A[1],B[1]))c+=100}
   segs.forEach(function(s){c+=Math.hypot(s[0].x-s[1].x,s[0].y-s[1].y)/40});return c}
  place();var best=cost(),improved=true,guard=0;
  while(improved&&guard++<8){improved=false;for(var i=0;i<ord.length;i++)for(var j=i+1;j<ord.length;j++){var tmp=ord[i];ord[i]=ord[j];ord[j]=tmp;place();var c=cost();if(c<best-1e-6){best=c;improved=true}else{tmp=ord[i];ord[i]=ord[j];ord[j]=tmp;place()}}}
 }
 u._lp=pos;return pos;
}
function hsl(h,s,l){return 'hsl('+h+','+s+'%,'+l+'%)'}
function hueOf(hex){var r=parseInt(hex.substr(1,2),16)/255,g=parseInt(hex.substr(3,2),16)/255,b=parseInt(hex.substr(5,2),16)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,h=0;if(d){h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h=Math.round(h*60);if(h<0)h+=360}return h}
function colorFor(s,mode){
 if(s.state==='locked')return TIERCOL.locked;
 if(mode==='subject'){var h=hueOf(sub[s.subj].color);if(s.state==='available')return hsl(h,60,78);return hsl(h,s.state==='started'?45:70,s.state==='started'?40:s.state==='learning'?48:s.state==='solid'?58:68)}
 return TIERCOL[s.state];
}
function pct(m){return Math.round(m*100)}
function glyph(s){return s.state==='mastered'?'★':s.state==='solid'?'●':s.state==='learning'?'◐':s.state==='started'?'◔':s.state==='available'?'○':'·'}
function lineState(e){return e.state}
function planetSVG(s,mode){
 var r=radius(s),c=colorFor(s,mode),tr=r+5,out='';
 if(s.review)out+='<circle class="rv" r="'+(tr+6)+'" fill="none" stroke="#c9d1d9" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="2 4"/>';
 if(s.state==='available')out+='<circle r="'+(tr+4)+'" fill="'+c+'" opacity=".10"/>';
 out+='<circle r="'+tr+'" fill="none" stroke="#ffffff" stroke-opacity="'+(s.state==='locked'?.16:.18)+'" stroke-width="2.5"'+(s.state==='locked'?' stroke-dasharray="1 5" stroke-linecap="round"':'')+'/>';
 if(s.state==='available')out+='<circle r="'+tr+'" fill="none" stroke="'+c+'" stroke-width="2.5" stroke-dasharray="5 4"/>';
 else if(s.m>0)out+='<circle r="'+tr+'" fill="none" stroke="'+c+'" stroke-width="3" pathLength="100" stroke-dasharray="'+(s.m*100).toFixed(1)+' 100" transform="rotate(-90)" stroke-linecap="round"/>';
 var fill=s.state==='locked'?'#2a313b':s.state==='available'?'#1b2330':c,op=s.state==='locked'?1:s.state==='available'?1:(.45+.55*Math.min(1,s.m/.85))*(.6+.4*(s.fresh==null?1:s.fresh));
 out+='<circle class="core" r="'+r+'" fill="'+fill+'" fill-opacity="'+op+'"'+(s.state==='available'?' stroke="'+c+'" stroke-opacity=".5"':'')+'/>';
 if(s.state==='mastered')out+='<text class="gl" y="'+(r*.38)+'" text-anchor="middle" font-size="'+(r*1.15)+'" fill="#06120a" font-weight="700">✓</text>';
 if(s.state==='available')out+='<text class="gl" y="'+(r*.38)+'" text-anchor="middle" font-size="'+(r*1.2)+'" fill="'+c+'" font-weight="700">+</text>';
 if(s.review)out+='<text class="gl" x="'+(tr+4)+'" y="'+(-tr+2)+'" font-size="'+Math.max(11,r*.7)+'" fill="#c9d1d9">↻</text>';
 if(s.early)out+='<text class="gl" x="'+(-tr-12)+'" y="'+(-tr+2)+'" font-size="'+Math.max(10,r*.6)+'" fill="#f0883e">◇</text>';
 return out;
}
function drawBadge(ctx,S,s,mode){ // canvas billboard for Three.js: same encoding as planetSVG
 var cx=S/2,cy=S/2,R=S*.30,tr=R+S*.055,c=colorFor(s,mode);ctx.clearRect(0,0,S,S);ctx.lineCap='round';
 function ring(rad,col,w,dash,alpha,frac){ctx.save();ctx.globalAlpha=alpha==null?1:alpha;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.setLineDash(dash||[]);ctx.beginPath();
  if(frac!=null)ctx.arc(cx,cy,rad,-Math.PI/2,-Math.PI/2+frac*2*Math.PI);else ctx.arc(cx,cy,rad,0,2*Math.PI);ctx.stroke();ctx.restore()}
 if(s.review)ring(tr+S*.06,'#c9d1d9',S*.015,[2,S*.035],.6);
 if(s.state==='available'){ctx.save();ctx.globalAlpha=.12;ctx.fillStyle=c;ctx.beginPath();ctx.arc(cx,cy,tr+S*.04,0,7);ctx.fill();ctx.restore()}
 ring(tr,'#ffffff',S*.028,s.state==='locked'?[1,S*.05]:null,.18);
 if(s.state==='available')ring(tr,c,S*.028,[S*.05,S*.04],1);else if(s.m>0)ring(tr,c,S*.034,null,1,s.m);
 ctx.save();ctx.fillStyle=s.state==='locked'?'rgba(42,49,59,.9)':s.state==='available'?'rgba(27,35,48,.9)':c;ctx.globalAlpha=s.state==='locked'||s.state==='available'?1:(.45+.55*Math.min(1,s.m/.85))*(.6+.4*(s.fresh==null?1:s.fresh));
 ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();ctx.restore();
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 '+Math.round(R*1.2)+'px system-ui';
 if(s.state==='mastered'){ctx.fillStyle='#06120a';ctx.fillText('✓',cx,cy+1)}
 if(s.state==='available'){ctx.fillStyle=c;ctx.fillText('+',cx,cy+1)}
 ctx.font='700 '+Math.round(S*.15)+'px system-ui';
 if(s.review){ctx.fillStyle='#c9d1d9';ctx.fillText('↻',cx+tr*.95,cy-tr*.95)}
}
function statusText(s){return s.state==='locked'?'Locked':s.state==='available'?'Ready to start':TIERLABEL[s.state]+' · '+pct(s.m)+'%'}
function why(s){
 var unmet=s.needs.filter(function(n){return !n.ok}),o='';
 if(s.state==='locked')o='Locked until '+unmet.map(function(n){return '<b>'+by[n.id].name+'</b> reaches Solid (55%) — you are at '+pct(n.have)+'%'}).join(' and ')+'. You can also start a Research path to open it early; that does not grant mastery.';
 else if(s.state==='available')o='Ready: every prerequisite is Solid or better. Practice here to light this planet and draw its first solid line.';
 else if(s.early)o='Opened early by a Research path (provisional). Prerequisite '+unmet.map(function(n){return '<b>'+by[n.id].name+'</b>'}).join(', ')+' is still below Solid; mastery here only counts once evidence gates pass.';
 else if(s.state==='started'||s.state==='learning')o='In progress. Next level is '+(s.state==='started'?'Learning (30%)':'Solid (55%)')+'; you are at '+pct(s.m)+'%.';
 else if(s.state==='solid')o='Solid. Mastered needs 85% plus a transfer item, varied contexts and low hint use.';
 else o='Mastered: 85%+ with transfer and low-scaffold evidence. It becomes credential-eligible after a 60-day retention check.';
 if(s.review)o+=' <span class="mut">Freshness '+pct(s.fresh)+'% — review suggested. Nothing you earned is removed.</span>';
 return o;
}
function meterHTML(m,need){
 var ticks=[.10,.30,.55,.85],bands=[['Started',.20],['Learning',.425],['Solid',.70],['Mastered',.925]];
 return '<div class="sg-meter" role="img" aria-label="Mastery '+pct(m)+' percent. Levels: Started 10, Learning 30, Solid 55, Mastered 85."><div class="sg-meter-bar"><i style="width:'+pct(m)+'%"></i>'+ticks.map(function(t){return '<u style="left:'+t*100+'%"></u>'}).join('')+'<b class="mk" style="left:'+pct(m)+'%"></b></div><div class="sg-meter-lab">'+ticks.map(function(t){return '<em style="left:'+t*100+'%">'+Math.round(t*100)+'</em>'}).join('')+bands.map(function(b){return '<span style="left:'+b[1]*100+'%">'+b[0]+'</span>'}).join('')+'</div></div>';
}
function mountDrawer(el,cb){
 cb=cb||{};var cur=null;
 function row(n,dir){var p=by[n.id];return '<button class="sg-row" data-go="'+p.id+'"><span class="sg-dot" style="background:'+colorFor(p,cb.mode&&cb.mode())+'"></span><span class="sg-rn"><b>'+p.name+'</b><span class="mut sm">'+sub[p.subj].name+(p.subj!==cur?' ↔':'')+' · '+statusText(p)+'</span></span>'+(dir==='pre'?'<span class="sg-need '+(n.ok?'ok':'no')+'">'+(n.ok?'✓ ':'')+'needs 55% · you '+pct(n.have)+'%</span>':'')+'</button>'}
 var api={show:function(s){
   var u=sub[s.subj],c=colorFor(s,cb.mode&&cb.mode());cur=s.subj;
   var deps=s.dep.map(function(id){return{id:id,ok:true}});
   el.innerHTML='<div class="row"><span class="pill" style="border-color:'+u.color+';color:'+u.color+'">'+u.name+' · '+u.tiers[s.tier]+'</span><span class="sp"></span><button class="btn ghost sm" data-close aria-label="Close detail">✕</button></div>'+
   '<h2>'+s.name+'</h2><div class="sg-chip" style="--c:'+c+'"><span class="sg-gl">'+glyph(s)+'</span> '+statusText(s)+(s.review?' · ↻ review suggested':'')+'</div>'+
   meterHTML(s.m)+'<p class="sg-why">'+why(s)+'</p>'+(SG.masteryHTML?SG.masteryHTML(s):'')+(SG.metaHTML?SG.metaHTML(s):'')+
   '<h3>Prerequisites <span class="mut sm">(each must be Solid, 55%)</span></h3>'+(s.needs.length?s.needs.map(function(n){return row(n,'pre')}).join(''):'<p class="mut sm">None. This is a starting skill.</p>')+
   '<h3>Unlocks</h3>'+(deps.length?deps.map(function(n){return row(n,'dep')}).join(''):'<p class="mut sm">Nothing further in this example map.</p>')+
   '<div class="row" style="margin-top:12px">'+(s.state==='locked'?'<button class="btn pri" data-act="research">🔬 Research to unlock</button>':'<button class="btn pri" data-act="practice">Practice now</button>')+'</div>'+
   '<p class="mut sm" style="margin-top:12px">Example data for design review. Real values come from the learner model (m_eff = p_known × recall).'+(s.days!=null?' Last evidence: '+s.days+' days ago (example).':'')+'</p>';
   el.classList.add('open');el.setAttribute('aria-hidden','false');el.dataset.skill=s.id;
   el.querySelector('[data-close]').onclick=function(){api.hide();cb.onClose&&cb.onClose()};
   Array.prototype.forEach.call(el.querySelectorAll('[data-go]'),function(b){b.onclick=function(){cb.onGo&&cb.onGo(b.dataset.go)}});
   Array.prototype.forEach.call(el.querySelectorAll('[data-act]'),function(b){b.onclick=function(){SG.toast(b.dataset.act==='practice'?'Demo only: would start a practice session for “'+s.name+'”.':'Demo only: would open a 3-step Research path (read, simulate, write-up). Opens the skill early; does not grant mastery.')}});
  },hide:function(){el.classList.remove('open');el.setAttribute('aria-hidden','true');delete el.dataset.skill}};
 return api;
}
function outline(el,cb){ // non-visual alternative (KM-020): hierarchical list with the same actions
 var html='';
 SUBJ.forEach(function(u){html+='<section class="sg-ol"><h3 style="color:'+u.color+'">'+u.name+' <span class="mut sm">'+u.skills.length+' skills · '+u.count.mastered+' mastered · '+u.count.available+' ready</span></h3>';
  u.tiers.forEach(function(tn,ti){var L=u.skills.filter(function(s){return s.tier===ti});if(!L.length)return;
   html+='<div class="sg-ol-t"><b>'+tn+'</b></div><ul>'+L.map(function(s){return '<li><button class="sg-row" data-go="'+s.id+'"><span class="sg-dot" style="background:'+colorFor(s,cb.mode&&cb.mode())+'"></span><span class="sg-rn"><b>'+s.name+'</b><span class="mut sm">'+statusText(s)+(s.review?' · review suggested':'')+(s.needs.length?' · needs: '+s.needs.map(function(n){return by[n.id].name+(n.ok?' ✓':' ('+pct(n.have)+'%)')}).join(', '):'')+'</span></span></button></li>'}).join('')+'</ul>'})
  html+='</section>'});
 el.innerHTML='<h2>List view <span class="mut sm">same skills, no map needed</span></h2>'+html;
 Array.prototype.forEach.call(el.querySelectorAll('[data-go]'),function(b){b.onclick=function(){cb.onGo(b.dataset.go)}});
}
function legend(el){
 var st=['locked','available','started','learning','solid','mastered'],h='<b>How to read a planet</b><div class="sg-lg">';
 st.forEach(function(k){var s={m:{locked:0,available:0,started:.2,learning:.42,solid:.7,mastered:.93}[k],state:k,review:false,subj:'chem',early:false};h+='<div><svg width="38" height="38" viewBox="-26 -26 52 52">'+planetSVG(s,'tier')+'</svg><span><b>'+TIERLABEL[k]+'</b><br><span class="mut sm">'+TIERRANGE[k]+'</span></span></div>'});
 h+='<div><svg width="38" height="38" viewBox="-26 -26 52 52">'+planetSVG({m:.7,state:'solid',review:true,subj:'chem',early:false},'tier')+'</svg><span><b>Review suggested</b><br><span class="mut sm">freshness &lt; 75%</span></span></div>';
 h+='</div><div class="sg-lg2"><div><svg width="46" height="10"><line x1="2" y1="5" x2="44" y2="5" stroke="#8b98a8" stroke-width="2" stroke-dasharray="5 4"/></svg> path open (prereqs met)</div><div><svg width="46" height="10"><line x1="2" y1="5" x2="44" y2="5" stroke="#58a6ff" stroke-width="3"/></svg> learning now (skill ≥ 30%)</div><div><svg width="46" height="10"><line x1="2" y1="5" x2="44" y2="5" stroke="#58a6ff" stroke-opacity=".5" stroke-width="1.8"/></svg> built (both ends Solid)</div><div><svg width="46" height="10"><line x1="2" y1="5" x2="44" y2="5" stroke="#6e7681" stroke-opacity=".6" stroke-width="1.5" stroke-dasharray="1 4"/></svg> shown only when you select a locked skill</div><div class="mut sm">Ring fill = mastery. Size = mastery. ✓ = mastered. ↻ = review.</div></div>';
 el.innerHTML=h+(SG.legendLayers?SG.legendLayers():'');
}
var toastT;function toast(t){var e=document.querySelector('.toast');if(!e){e=document.createElement('div');e.className='toast';e.setAttribute('role','status');document.body.appendChild(e)}e.textContent=t;e.style.display='block';clearTimeout(toastT);toastT=setTimeout(function(){e.style.display='none'},3200)}
function reduced(){return window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches}
window.SG={outerR:outerR,orbitAngle:function(s){var O=SG.orbit;return O?(sub[s.subj].dense?O.ang(2):O.ang(s.tier)):0},TH:TH,TIERCOL:TIERCOL,TIERLABEL:TIERLABEL,SUBJ:SUBJ,SK:SK,by:by,sub:sub,compute:compute,ringR:ringR,labelAngle:labelAngle,radius:radius,layout:layout,colorFor:colorFor,planetSVG:planetSVG,drawBadge:drawBadge,statusText:statusText,glyph:glyph,pct:pct,mountDrawer:mountDrawer,outline:outline,legend:legend,toast:toast,reduced:reduced,hueOf:hueOf};
compute();
})();
