/* Prototype D renderer: Galaxy of star clusters. Subject = cluster, domain/layer = star, skill = planet.  EXAMPLE DATA. */
(function(){
var CL=SG.CL,NS='http://www.w3.org/2000/svg';
function E(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}function sm01(t){t=clamp(t,0,1);return t*t*(3-2*t)}function lerp(a,b,t){return a+(b-a)*t}
function reduced(){return SG.reduced()||document.body.classList.contains('rm')}
var UI=SGUI.build({title:'Skill Galaxy · D · star clusters',hint:'Galaxy: only unlocked stars · click a cluster to zoom in'});
var stage=UI.stage,colorMode='tier',W=stage.clientWidth||1280,H=stage.clientHeight||720;
var svg=E('svg',{class:'sgd',role:'group','aria-label':'Skill galaxy of star clusters. Tab walks the objects you can open. Escape goes up one level. Plus and minus zoom.',tabindex:-1});stage.insertBefore(svg,stage.firstChild);
var defs=E('defs',{},svg),camG=E('g',{},svg),gHalo=E('g',{},camG),gEdge=E('g',{},camG),gStar=E('g',{},camG),gMeta=E('g',{},camG),gPl=E('g',{},camG),gLbl=E('g',{'aria-hidden':'true'},camG);
var live=document.createElement('div');live.className='sgd-live';live.setAttribute('role','status');live.setAttribute('aria-live','polite');stage.appendChild(live);
var hud=document.createElement('aside');hud.className='sgd-hud';hud.setAttribute('aria-label','Where you are');stage.appendChild(hud);
var cam={x:0,y:0,k:.2},S={level:'galaxy',subj:null,star:null,skill:null,starT:0,showLocked:false,ghostOn:false},objs=[],tw=null,dirty=true,TMP=false;
var PXMIN=11,KDETAIL=1.7;
// ---------- scene ----------
var hues={};function grad(h){var id='gh'+h.slice(1);if(!hues[id]){hues[id]=1;var g=E('radialGradient',{id:id},defs);E('stop',{offset:'0','stop-color':h,'stop-opacity':'.55'},g);E('stop',{offset:'.45','stop-color':h,'stop-opacity':'.16'},g);E('stop',{offset:'1','stop-color':h,'stop-opacity':'0'},g)}return 'url(#'+id+')'}
function lockPath(){return 'M-6 -2 v-5 a6 6 0 0 1 12 0 v5'}
function mkObj(kind,el){var o={kind:kind,el:el,vis:false};objs.push(o);return o}
function starPct(st){return Math.round(st.solidShare*100)}
function starDesc(st){return st.name+(st.zone?' ('+st.zone+')':'')+', '+st.n+' skills, '+starPct(st)+' percent solid, '+(st.kind==='locked'?'locked':st.kind==='mastered'?'mastered':st.kind==='new'?'ready to explore':'in progress')}
function build(){
 CL.clusters.forEach(function(c){
  var g=E('g',{'data-kind':'cluster','data-id':c.id,role:'button',tabindex:-1,'aria-label':c.name+' star cluster'},gHalo);
  c.halo=E('circle',{r:100,fill:grad(c.color),'pointer-events':'all'},g);E('circle',{class:'focusring',r:100},g);
  c.lblG=E('g',{class:'lbl'},gLbl);c.tName=E('text',{class:'cl-name'},c.lblG);c.tSub=E('text',{class:'cl-sub'},c.lblG);
  c.el=g;c.oCl=mkObj('cluster',g);
  c.stars.forEach(function(st){
   var h=E('g',{'data-kind':'star','data-id':st.id,role:'button',tabindex:-1,'aria-label':starDesc(st)},gStar);
   E('title',{},h).textContent=starDesc(st);
   var glow=E('circle',{r:78,fill:grad(st.hue)},h);E('circle',{r:38,fill:'none',stroke:'#fff','stroke-opacity':.13,'stroke-width':4},h);
   var pr=E('circle',{r:38,fill:'none',stroke:st.hue,'stroke-width':4.5,'stroke-linecap':'round',pathLength:100,'stroke-dasharray':(st.solidShare*100).toFixed(1)+' 100',transform:'rotate(-90)'},h);
   var core=E('circle',{r:30},h),mk=E('g',{},h);
   if(st.kind==='mastered'){core.setAttribute('fill',st.hue);core.setAttribute('fill-opacity',.8);E('text',{y:11,'text-anchor':'middle','font-size':32,'font-weight':700,fill:'#06120a'},mk).textContent='✓'}
   else if(st.kind==='locked'){core.setAttribute('fill','#262d36');core.setAttribute('stroke','#6e7681');core.setAttribute('stroke-dasharray','2 5');core.setAttribute('stroke-width',2);pr.setAttribute('stroke-opacity',.0);E('rect',{x:-9,y:-3,width:18,height:14,rx:3,fill:'#8b98a8'},mk);E('path',{d:lockPath(),fill:'none',stroke:'#8b98a8','stroke-width':3,'stroke-linecap':'round',transform:'translate(0 -1)'},mk)}
   else if(st.kind==='new'){core.setAttribute('fill','#1b2330');core.setAttribute('stroke',st.hue);core.setAttribute('stroke-width',2.5);pr.setAttribute('stroke-opacity',0);E('circle',{r:38,fill:'none',stroke:'#fff','stroke-width':2.5,'stroke-dasharray':'6 5'},h);E('text',{y:10,'text-anchor':'middle','font-size':30,'font-weight':700,fill:st.hue},mk).textContent='+'}
   else{core.setAttribute('fill',st.hue);core.setAttribute('fill-opacity',.55+.4*st.solidShare)}
   var moons=E('g',{class:'moons','aria-hidden':'true'},h);if(st.kind==='active'||st.kind==='new'){st.moonEls=[0,1,2].map(function(i){return E('circle',{class:'moon',r:3.2-(i*.4)},moons)})}
   E('circle',{class:'focusring',r:44},h);
   st.el=h;st.coreEl=core;st.glowEl=glow;st.oSt=mkObj('star',h);
   st.lbl=E('g',{class:'lbl'},gLbl);st.tN=E('text',{class:'s-name'},st.lbl);st.tspans=[E('tspan',{},st.tN),E('tspan',{dy:'1.15em'},st.tN)];st.tS=E('text',{class:'s-sub'},st.lbl);st.tR=E('text',{class:'s-req'},st.lbl);
   st.tS.textContent=st.n+' skills · '+starPct(st)+'% solid';
   var nx=st.need.filter(function(x){return !x.ok});st.tR.textContent=nx.length?'needs '+nx.map(function(x){return x.star.short+' '+Math.round(CL.UNLOCK*100)+'% (now '+Math.round(x.have*100)+'%)'}).join(' + '):'';
   st.nextInLine=!st.unlocked&&st.need.filter(function(x){return x.star.unlocked}).length>0&&nx.every(function(x){return x.star.unlocked});
  });
  // meta-cluster (mastered stars collapsed) + collapse chip
  if(c.meta){var m=E('g',{'data-kind':'meta','data-id':c.id,role:'button',tabindex:-1,'aria-label':c.meta.name+', '+c.meta.n+' stars, '+c.meta.skills+' skills. Press Enter to expand.'},gMeta);
   E('title',{},m).textContent=c.meta.name+' (click to expand)';
   E('circle',{r:80,fill:grad('#3fb950')},m);E('circle',{r:48,fill:'#0f1a14','fill-opacity':.9,stroke:'#3fb950','stroke-opacity':.7,'stroke-width':2.5},m);
   var mem=c.mastered.slice().sort(function(a,b){return a.cx-b.cx||a.cy-b.cy});
   mem.forEach(function(s,i){var n=mem.length,a=-Math.PI/2+i/n*2*Math.PI;if(n===1){E('circle',{r:9,fill:s.hue},m);return}E('circle',{cx:(31*Math.cos(a)).toFixed(1),cy:(31*Math.sin(a)).toFixed(1),r:6.2,fill:s.hue,'fill-opacity':.9},m)});
   E('text',{y:10,'text-anchor':'middle','font-size':n1(mem.length)?30:24,'font-weight':700,fill:'#3fb950'},m).textContent='✓';
   E('circle',{class:'focusring',r:54},m);c.metaEl=m;c.oMeta=mkObj('meta',m);
   c.mlbl=E('g',{class:'lbl'},gLbl);c.mN=E('text',{class:'s-name'},c.mlbl);c.mS=E('text',{class:'s-sub'},c.mlbl);c.mN.textContent=c.meta.name;c.mS.textContent=c.meta.n+(c.meta.n===1?' star':' stars')+' · '+c.meta.skills+' skills · click to expand';
   var ch=E('g',{class:'chip','data-kind':'meta','data-id':c.id,role:'button',tabindex:-1,'aria-label':'Collapse mastered stars','aria-hidden':'true'},gMeta);c.chipR=E('rect',{rx:12,height:24,y:-12},ch);c.chipT=E('text',{y:4},ch);c.chipT.textContent='◂ Collapse mastered stars';c.chip=ch;c.oChip=mkObj('meta',ch)}
  // edges between stars
  c.edges=[];c.stars.forEach(function(b){b.pre.forEach(function(pid){var a=CL.star[pid];var el=E('line',{class:'edge'},gEdge);c.edges.push({a:a,b:b,el:el,o:mkObj('edge',el)})})});
 });
}
function n1(n){return n===1}
function wrap(t,n){if(t.length<=n)return[t];var i=t.lastIndexOf(' ',n);if(i<6)i=t.indexOf(' ',n);if(i<0)return[t];var a=t.slice(0,i),b=t.slice(i+1);if(b.length>n+3)b=b.slice(0,n+1)+'…';return[a,b]}
// ---------- planets (built when a star is opened) ----------
function PS(st){return SG.sub[st.cl.id].dense?1.9:1.25}
function buildPlanets(st){
 if(st.plG)return;var g=E('g',{class:'plg','data-star':st.id},gPl);st.plG=g;st.plN={};var ps=PS(st);
 st.rings.forEach(function(r){E('circle',{class:'ring-r',r:r},g)});st.plEdges=E('g',{},g);
 st.skills.forEach(function(id){var s=SG.by[id],pos=st.ring[id];
  var n=E('g',{class:'pl','data-kind':'planet','data-id':id,role:'button',tabindex:-1,'aria-label':s.name+', '+SG.statusText(s)+(s.review?', review suggested':'')},g);
  E('title',{},n).textContent=s.name+' · '+SG.statusText(s);
  var rad=SG.radius(s);E('circle',{class:'hit',r:(rad+11)*ps,fill:'transparent'},n);
  var b=E('g',{transform:'scale('+ps+')'},n);b.innerHTML=SG.planetSVG(s,colorMode)+(SG.dimSVG?SG.dimSVG(s):'');
  E('circle',{class:'focusring',r:(rad+17)*ps},n);
  var lb=E('text',{class:'plabel',y:((rad+8)*ps).toFixed(1)},n);lb.textContent=s.name.length>26?s.name.slice(0,25)+'…':s.name;
  if(s.state==='available'||s.state==='started'||s.state==='learning'||s.review)n.classList.add('hot');
  st.plN[id]={g:n,pos:pos,s:s,b:b,o:mkObj('planet',n)}});
 placePlanets(st);
}
function placePlanets(st){if(!st.plN)return;var O=SG.orbit;for(var id in st.plN){var q=st.plN[id],a=q.pos.a+(O?O.ang(q.pos.ri):0),x=q.pos.r*Math.cos(a),y=q.pos.r*Math.sin(a);q.x=x;q.y=y;q.g.setAttribute('transform','translate('+x.toFixed(1)+' '+y.toFixed(1)+')')}}
function recolor(){CL.clusters.forEach(function(c){c.stars.forEach(function(st){if(!st.plN)return;for(var id in st.plN){var q=st.plN[id];q.b.innerHTML=SG.planetSVG(q.s,colorMode)+(SG.dimSVG?SG.dimSVG(q.s):'')}})})}
// ---------- camera ----------
function drawerInset(){return UI.draw.classList.contains('open')?360:0}
function fitBox(b,o){o=o||{};var pad=o.pad==null?120:o.pad,ins=o.inset==null?drawerInset():o.inset,il=o.left||0,top=o.top==null?20:o.top,bot=o.bot==null?64:o.bot,aw=Math.max(200,W-ins-il),ah=Math.max(200,H-top-bot),bw=b.x1-b.x0+2*pad,bh=b.y1-b.y0+2*pad,k=Math.min(aw/bw,ah/bh,o.kmax||1.3);
 var cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2,acy=top+ah/2;return{k:k,x:cx+((ins-il)/2)/k,y:cy-(acy-H/2)/k}}
function bbox(pts){var b={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9};pts.forEach(function(p){b.x0=Math.min(b.x0,p[0]);b.x1=Math.max(b.x1,p[0]);b.y0=Math.min(b.y0,p[1]);b.y1=Math.max(b.y1,p[1])});return b}
function clusterPts(c,expanded){var pts=[];if(c.meta&&!expanded)pts.push([c.meta.wx,c.meta.wy]);c.stars.forEach(function(s){if(s.unlocked&&(!s.mastered||expanded))pts.push([s.wx,s.wy])});if(!pts.length)c.stars.forEach(function(s){pts.push([s.wx,s.wy])});return pts}
function clusterFit(c,o){var b=bbox(clusterPts(c,c.expanded));o=o||{};return fitBox(b,{pad:o.pad||150,kmax:1.5,inset:o.inset==null?rInset():o.inset,left:hudW()})}
function chartFit(c){var pts=[];if(c.meta&&!c.expanded)pts.push([c.meta.wx,c.meta.wy]);c.stars.forEach(function(s){if(!(s.mastered&&!c.expanded))pts.push([s.wx,s.wy])});return fitBox(bbox(pts),{pad:120,kmax:1,inset:rInset(),left:hudW()})}
function rInset(){return Math.max(drawerInset(),255)}
function hudW(){return hud.hidden?0:310}
function galaxyFit(){var pts=[];CL.clusters.forEach(function(c){clusterPts(c,false).forEach(function(p){pts.push(p)})});var b=bbox(pts);return fitBox(b,{pad:430,kmax:.5,inset:0})}
function starFit(st,inset){var R=(st.R||150)+95;return fitBox({x0:st.wx,x1:st.wx,y0:st.wy,y1:st.wy},{pad:R,kmax:1.9,inset:inset==null?drawerInset():inset,top:24,bot:56,left:inset>0?0:hudW()})}
function kGE(c){return .75*chartFit(c).k}
function flyTo(t,ms){if(reduced()||!ms){cam.x=t.x;cam.y=t.y;cam.k=t.k;tw=null;dirty=true;frame();return}tw={t0:performance.now(),ms:ms,f:{x:cam.x,y:cam.y,k:cam.k},t:t};schedule()}
// ---------- levels ----------
function crumb(){var c=S.subj&&CL.by[S.subj],parts=[{t:'Galaxy',fn:S.level!=='galaxy'?goGalaxy:null}];
 if(c&&S.level!=='galaxy'){var st=S.star&&CL.star[S.star];parts.push({t:c.name,fn:S.level==='star'?function(){exitStar()}:null});
  if(st){if(st.mastered)parts.push({t:'Mastered stars',fn:function(){exitStar()}});parts.push({t:st.name,fn:S.skill?function(){deselect()}:null});if(S.skill)parts.push({t:SG.by[S.skill].name,fn:null})}}
 UI.setCrumb(parts)}
function hudHTML(){var c=S.subj&&CL.by[S.subj];if(S.level==='galaxy'||!c)return '';
 if(S.level==='cluster'){var f=c.frontier.filter(function(s){return s.unlocked}),ul=c.stars.filter(function(s){return s.unlocked}).length;
  return '<h2>'+c.name+'</h2><div class="mut">'+c.stars.length+' stars · '+ul+' unlocked · '+c.solidN+' of '+c.skillsN+' skills solid</div>'+
  '<h3>Now</h3>'+(f.length?f.map(function(s){return '<div class="need"><span>'+s.name+'</span><b>'+(s.kind==='new'?'ready':starPct(s)+'%')+'</b></div>'}).join(''):'<div class="mut">Every unlocked star is mastered.</div>')+
  (c.meta?'<div class="row2"><button class="btn" data-act="expand">'+(c.expanded?'Collapse':'Expand')+' '+c.mastered.length+' mastered '+(c.mastered.length===1?'star':'stars')+'</button></div>':'')+
  '<div class="mut sm" style="margin-top:6px">Click a star to open its planets. Zoom out to see locked stars; zoom out further to return to the galaxy.</div>'}
 var st=CL.star[S.star];
 return '<h2>'+st.name+'</h2><div class="mut">'+st.blurb+'</div><div class="bar" aria-hidden="true"><i style="width:'+starPct(st)+'%"></i></div><div class="mut">'+st.n+' skills · '+starPct(st)+'% solid · '+Math.round(st.doneShare*100)+'% mastered'+(st.review?' · '+st.review+' to review':'')+'</div>'+
  '<div class="row2">'+['mastered','solid','learning','started','available','locked'].filter(function(k){return st.counts[k]}).map(function(k){return '<span class="tag" style="border-color:'+SG.TIERCOL[k]+'">'+st.counts[k]+' '+SG.TIERLABEL[k].toLowerCase()+'</span>'}).join('')+'</div>'+
  (st.need.length?'<h3>Needs</h3>'+st.need.map(function(x){return '<div class="need '+(x.ok?'ok':'no')+'"><span>'+x.star.name+'</span><b>'+(x.ok?'✓ ':'')+Math.round(x.have*100)+'% / '+Math.round(CL.UNLOCK*100)+'%</b></div>'}).join(''):'<div class="mut" style="margin-top:4px">A starting star: nothing needed.</div>')+
  (st.dep.length?'<h3>Opens</h3>'+st.dep.map(function(d){var D=CL.star[d];return '<div class="need '+(D.unlocked?'ok':'no')+'"><span>'+D.name+'</span><b>'+(D.unlocked?'unlocked':'locked')+'</b></div>'}).join(''):'')+
  '<div class="row2"><button class="btn" data-act="up">◂ '+c.name+' cluster</button></div>'}
function announce(t){live.textContent='';setTimeout(function(){live.textContent=t},30)}
function setLevel(level,subj,star,noFly){
 S.level=level;if(subj)S.subj=subj;S.star=star?star.id:null;if(level!=='star'){S.skill=null;UI.draw.classList.remove('open');drawer.hide();UI.shift(false)}
 var c=S.subj&&CL.by[S.subj];UI.showAttrs(level==='galaxy'?null:S.subj);
 hud.hidden=level==='galaxy';hud.innerHTML=hudHTML();crumb();
 UI.hint.textContent=level==='galaxy'?'Galaxy: only unlocked stars · click a cluster to zoom in':level==='cluster'?'Cluster: unlocked stars · zoom out for locked ones · click a star to open it':'Star: planets orbit it · click a planet · Esc goes back';
 applyFocusables();dirty=true;schedule()}
function goGalaxy(){S.skill=null;setLevel('galaxy',null,null);flyTo(galaxyFit(),900);announce('Galaxy view. Clusters show unlocked stars only.')}
function enterCluster(id,noFly){var c=CL.by[id];S.skill=null;setLevel('cluster',id,null);if(!noFly)flyTo(clusterFit(c),900);announce(c.name+' cluster. '+c.stars.filter(function(s){return s.unlocked}).length+' unlocked stars.')}
function enterStar(id,noFly,inset){var st=CL.star[id],c=st.cl;if(st.mastered&&!c.expanded){c.expanded=true;c.expT=1}buildPlanets(st);S.skill=null;setLevel('star',c.id,st);if(!st.unlocked)TMP=true;
 if(!noFly)flyTo(starFit(st,inset),900);announce(st.name+' star. '+st.n+' skills orbit it.')}
function exitStar(){var c=CL.by[S.subj];S.skill=null;setLevel('cluster',S.subj,null);flyTo(clusterFit(c),800)}
function toggleExpand(c){c.expanded=!c.expanded;dirty=true;schedule();if(S.level!=='cluster')S.level==='galaxy'&&enterCluster(c.id,true);hud.innerHTML=hudHTML();flyTo(clusterFit(c),900);applyFocusables();announce(c.expanded?'Mastered stars expanded.':'Mastered stars collapsed into one group.')}
function up(){if(S.skill)return deselect();if(S.level==='star')return exitStar();if(S.level==='cluster')return goGalaxy()}
// ---------- skills ----------
var drawer=SG.mountDrawer(UI.draw,{mode:function(){return colorMode},onClose:function(){deselect(true)},onGo:function(id){goSkill(id)}});
function selectSkill(id){var s=SG.by[id],st=CL.ofSkill[id];if(S.star!==st.id)enterStar(st.id,true);S.skill=id;UI.draw.classList.add('open');drawer.show(s);UI.shift(true);svg.classList.add('has-sel');
 Object.keys(st.plN).forEach(function(k){var q=st.plN[k];q.g.classList.toggle('sel',k===id);q.g.classList.remove('hl')});
 drawPlanetEdges(st,s);crumb();flyTo(starFit(st,360),700);announce(s.name+', '+SG.statusText(s))}
function deselect(fromClose){var st=S.star&&CL.star[S.star];S.skill=null;if(!fromClose){UI.draw.classList.remove('open');drawer.hide();UI.shift(false)}else{UI.draw.classList.remove('open');UI.shift(false)}svg.classList.remove('has-sel');
 if(st&&st.plN){for(var k in st.plN){st.plN[k].g.classList.remove('sel','hl')}st.plEdges.innerHTML=''}crumb();if(st&&S.level==='star')flyTo(starFit(st,0),600)}
function goSkill(id){var st=CL.ofSkill[id];if(!st.unlocked)TMP=true;if(st.cl.id!==S.subj||S.star!==st.id){enterStar(st.id,true,360)}buildPlanets(st);selectSkill(id)}
function drawPlanetEdges(st,s){st.plEdges.innerHTML='';var q=st.plN[s.id];if(!q)return;var cls={};
 function line(a,b,ok,dep){E('line',{class:'pedge',x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:ok?'#58a6ff':'#8b98a8','stroke-width':ok?2.4:1.8,'stroke-dasharray':ok?'':'6 5','stroke-opacity':.9},st.plEdges)}
 s.needs.forEach(function(n){var p=st.plN[n.id];if(p){line(p,q,n.ok,false);p.g.classList.add('hl')}else{stub(q,CL.ofSkill[n.id],'from',n.ok)}});
 s.dep.forEach(function(id){var p=st.plN[id];if(p){line(q,p,true,true);p.g.classList.add('hl')}else{stub(q,CL.ofSkill[id],'to',true)}});
 function stub(q,other,dir,ok){var a=Math.atan2(q.y,q.x),R=st.R+105,x=R*Math.cos(a),y=R*Math.sin(a);E('line',{class:'pedge',x1:q.x,y1:q.y,x2:x,y2:y,stroke:ok?'#58a6ff':'#8b98a8','stroke-width':1.8,'stroke-dasharray':'3 5'},st.plEdges);
  var t=E('text',{x:x,y:y,'text-anchor':Math.cos(a)>.2?'start':Math.cos(a)<-.2?'end':'middle',style:'font-size:calc(11px*var(--ik));fill:#c4b5fd;paint-order:stroke;stroke:#05070b;stroke-width:calc(3px*var(--ik))'},st.plEdges);t.textContent=(dir==='from'?'← from ':'→ to ')+other.short}}
// ---------- render ----------
function ghostA(c){if(S.showLocked||TMP)return 1;if(S.level!=='cluster'||c.id!==S.subj)return 0;var kf=clusterFit(c).k,ke=kGE(c),k=cam.k;return sm01((kf*.92-k)/(kf*.25))*sm01((k-ke*.95)/(ke*.25))}
function cop(c){if(!S.subj||c.id===S.subj)return 1;var ke=kGE(CL.by[S.subj]);return sm01((ke*1.02-cam.k)/(ke*.45))}
function onScreen(x,y,m){var sx=(x-cam.x)*cam.k+W/2,sy=(y-cam.y)*cam.k+H/2;return sx>-m&&sx<W+m&&sy>-m&&sy<H+m}
function setOp(el,o){var v=o>.03;el.style.opacity=o>=.995?'':o.toFixed(2);el.style.display=v?'':'none'}
function render(){
 dirty=false;var k=cam.k,ik=1/k,L=S.level;svg.style.setProperty('--ik',ik);camG.setAttribute('transform','translate('+W/2+' '+H/2+') scale('+k+') translate('+(-cam.x)+' '+(-cam.y)+')');
 svg.classList.toggle('lv-detail',L==='star'&&k>=KDETAIL);
 var op=SG.orbit;
 CL.clusters.forEach(function(c){
  var chartK=chartFit(c).k,cp=cop(c),ga=ghostA(c),isF=c.id===S.subj,E1=c.expT,inStar=S.star&&CL.star[S.star].cl===c,sT=inStar?S.starT:0;
  var pts=clusterPts(c,false),b=bbox(pts),mx=(b.x0+b.x1)/2,my=(b.y0+b.y1)/2,rad=Math.max(Math.hypot(b.x1-b.x0,b.y1-b.y0)/2+110,16*ik);
  var galaxy=L==='galaxy';
  c.halo.setAttribute('cx',mx);c.halo.setAttribute('cy',my);c.halo.setAttribute('r',rad);c.halo.style.pointerEvents=galaxy?'all':'none';c.halo.style.opacity=galaxy?'':'.0';
  c.el.querySelector('.focusring').setAttribute('cx',mx);c.el.querySelector('.focusring').setAttribute('cy',my);c.el.querySelector('.focusring').setAttribute('r',rad);
  c.lblG.style.opacity=galaxy?cp:0;c.tName.setAttribute('x',mx);c.tSub.setAttribute('x',mx);var ty=b.y0-Math.max(70,36*ik);c.tName.setAttribute('y',ty);c.tSub.setAttribute('y',ty+17*ik);
  c.tName.textContent=c.name;c.tSub.textContent=c.stars.filter(function(s){return s.unlocked}).length+' of '+c.stars.length+' stars unlocked · now: '+(c.frontier.length?c.frontier.slice(0,2).map(function(s){return s.short}).join(', '):'all mastered');
  c.el.style.display=(galaxy&&cp>.03)?'':'none';c.oCl.vis=galaxy&&cp>.03&&onScreen(mx,my,40);
  // stars
  c.stars.forEach(function(st){
   var d=CL.disp(st),o,R,vis;
   if(st.mastered){o=(S.star===st.id)?1:E1;R=lerp(6,16,E1)}
   else if(!st.unlocked){o=ga;R=22}else{o=1;R=st.primary?40:st.kind==='new'?27:30}
   if(S.star===st.id){R=lerp(R,42,S.starT)}else o*=(1-sT);
   if(L==='galaxy'&&!st.unlocked&&!S.showLocked)o=0;
   o*=cp;st._op=o;st._eop=st.mastered?cp:o;
   var s=Math.max(R,PXMIN*ik)/30;
   st.el.setAttribute('transform','translate('+d.x.toFixed(1)+' '+d.y.toFixed(1)+') scale('+s.toFixed(3)+')');setOp(st.el,o);
   var interactive=o>.5&&(L!=='galaxy');st.el.style.pointerEvents=(o>.35)?'all':'none';
   if(st.moonEls){st.el.querySelector('.moons').style.opacity=(1-S.starT).toFixed(2);st.moonEls.forEach(function(m,i){var a=(op?op.ang(i+1)*6:0)+i*2.1,r=48+i*9;m.setAttribute('cx',(r*Math.cos(a)).toFixed(1));m.setAttribute('cy',(r*Math.sin(a)).toFixed(1))})}
   var showName=(L==='galaxy')?false:(L==='cluster'?o>.35:(S.star===st.id));
   var small=(L==='cluster'&&(st.mastered||!st.unlocked))||L==='galaxy';
   var lo=showName?o:0,sr=s*38,yy=d.y+sr+16*ik;
   st.lbl.style.opacity=lo;st.lbl.style.display=lo>.03?'':'none';var nm=small?(st.mastered||!st.unlocked?st.short:st.name):st.name,ln=wrap(nm,small?18:24);st.tN.setAttribute('x',d.x);st.tN.setAttribute('y',yy);st.tN.setAttribute('class','s-name'+(small?' sm':''));st.tspans[0].setAttribute('x',d.x);st.tspans[1].setAttribute('x',d.x);st._lab=null;var key=ln.join('|');if(st._nm!==key){st.tspans[0].textContent=ln[0];st.tspans[1].textContent=ln[1]||'';st._nm=key}var extra=(ln.length>1?(small?14.5:16.5):0)*ik;
   var showSub=!small&&L!=='galaxy'&&st.unlocked;st.tS.setAttribute('x',d.x);st.tS.setAttribute('y',yy+15*ik+extra);st.tS.style.display=showSub?'':'none';
   var showReq=L==='cluster'&&!st.unlocked&&st.nextInLine&&k>chartK*1.25;st.tR.setAttribute('x',d.x);st.tR.setAttribute('y',yy+13*ik+extra);st.tR.style.display=showReq?'':'none';if(lo>.03&&L==='cluster'){var mw=Math.max(ln[0].length,(ln[1]||'').length)*(small?6:6.8)+8,mh=(ln.length>1?(small?29:33):15)+(showSub?15:0)+(showReq?14:0);if(showReq)mw=Math.max(mw,170);st._lab={x:(d.x-cam.x)*k+W/2,y:(yy-cam.y)*k+H/2-12,w:mw,h:mh,p:st.primary?0:st.kind==='active'?1:st.unlocked&&!st.mastered?2:st.nextInLine?3:st.mastered?5:4}}
   st.oSt.vis=o>.12&&(L==='galaxy'?st.unlocked&&!st.mastered:true)&&onScreen(d.x,d.y,30)&&!(st.mastered&&E1<.1&&S.star!==st.id);
   if(st.mastered&&E1<.03&&S.star!==st.id){st.el.style.display='none';st.lbl.style.display='none'}
  });
  if(L==='cluster'&&c.id===S.subj){var rects=[],cand=[];if(c.meta&&(1-E1)*cp>.5){var mm=c.meta;rects.push({x:(mm.wx-cam.x)*k+W/2,y:(mm.wy+48*Math.max(1,11*ik/48)+5*ik-cam.y)*k+H/2,w:200,h:30})}c.stars.forEach(function(st){if(st._lab)cand.push(st)});cand.sort(function(a,b){return a._lab.p-b._lab.p});cand.forEach(function(st){var r=st._lab,hit=rects.some(function(q){return Math.abs(r.x-q.x)*2<r.w+q.w&&r.y<q.y+q.h&&q.y<r.y+r.h});if(hit){st.lbl.style.display='none';st.oLab=0}else{rects.push(r)}})}
  // meta
  if(c.meta){var mo=(1-E1)*cp*(1-sT),ms=Math.max(1,11*ik/48);setOp(c.metaEl,mo);c.metaEl.setAttribute('transform','translate('+c.meta.wx+' '+c.meta.wy+') scale('+ms.toFixed(3)+')');c.metaEl.style.pointerEvents=mo>.35?'all':'none';
   c.mlbl.style.opacity=(L==='galaxy'?0:mo);c.mlbl.style.display=(L!=='galaxy'&&mo>.03)?'':'none';c.mN.setAttribute('x',c.meta.wx);c.mN.setAttribute('y',c.meta.wy+48*ms+17*ik);c.mS.setAttribute('x',c.meta.wx);c.mS.setAttribute('y',c.meta.wy+48*ms+32*ik);
   c.oMeta.vis=mo>.12&&onScreen(c.meta.wx,c.meta.wy,40)&&L!=='star'||(mo>.12&&onScreen(c.meta.wx,c.meta.wy,40));
   var members=c.mastered,minx=Math.min.apply(null,members.map(function(s){return s.wx}))-110,my2=c.meta.wy-0;var co=E1*cp*(1-sT);setOp(c.chip,co);c.chip.style.pointerEvents=co>.35?'all':'none';
   var tw2=(c.chipT.textContent.length*6.4+26)*ik;c.chipT.setAttribute('x',0);c.chipR.setAttribute('width',tw2);c.chipR.setAttribute('x',-tw2/2);c.chipR.setAttribute('height',26*ik);c.chipR.setAttribute('y',-13*ik);c.chipR.setAttribute('rx',13*ik);c.chipT.setAttribute('y',4.2*ik);
   var cy0=Math.min.apply(null,members.map(function(s){return s.wy}));var mxx=Math.max.apply(null,members.map(function(s){return s.wx})),chx=(minx+110+mxx)/2;c.chip.setAttribute('transform','translate('+chx+' '+(cy0-95)+')');c.oChip.vis=co>.12&&onScreen(chx,cy0-95,40)}
  // edges
  var seen={};c.edges.forEach(function(e){var a=e.a,b2=e.b,da=CL.disp(a),db=CL.disp(b2),eo,cls;
   var bothM=a.mastered&&b2.mastered;
   if(bothM){eo=E1*cp;cls='edge old'}else if(!b2.unlocked){eo=Math.min(ga,a._eop==null?1:a._eop)*cp;cls='edge ghost'}else{eo=Math.min(a._eop==null?cp:a._eop,b2._eop==null?cp:b2._eop);cls='edge on';
    if(a.mastered&&E1<.5){var key='m'+c.id+'>'+b2.id;if(seen[key]){eo=0}else seen[key]=1}}
   if(L==='galaxy'&&!S.showLocked&&!b2.unlocked)eo=0;
   if(S.star)eo*=(1-sT);
   e.el.setAttribute('class',cls);e.el.setAttribute('x1',da.x.toFixed(1));e.el.setAttribute('y1',da.y.toFixed(1));e.el.setAttribute('x2',db.x.toFixed(1));e.el.setAttribute('y2',db.y.toFixed(1));setOp(e.el,eo);e.o.vis=eo>.12&&(onScreen(da.x,da.y,10)||onScreen(db.x,db.y,10))});
  // planets of the open star
  c.stars.forEach(function(st){if(!st.plG)return;var open=S.star===st.id,po=open?S.starT:0;st.plG.setAttribute('transform','translate('+st.wx+' '+st.wy+')');setOp(st.plG,po);
   if(open||st.plG.style.display!=='none'){var any=false;for(var id in st.plN){var q=st.plN[id];q.o.vis=open&&po>.4&&onScreen(st.wx+q.x,st.wy+q.y,20)}}
   else for(var id2 in st.plN)st.plN[id2].o.vis=false})
 });
}
function counts(){var r={total:0,cluster:0,star:0,meta:0,planet:0,edge:0};objs.forEach(function(o){if(o.vis){r.total++;r[o.kind]++}});r.nonEdge=r.total-r.edge;return r}
// ---------- loop ----------
var raf=0,last=0;
function schedule(){if(!raf)raf=requestAnimationFrame(frame)}
function frame(t){raf=0;var now=performance.now(),dt=Math.min(.1,(now-(last||now))/1000);last=now;var busy=false;
 if(tw){var u=clamp((now-tw.t0)/tw.ms,0,1),e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;cam.k=Math.exp(lerp(Math.log(tw.f.k),Math.log(tw.t.k),e));cam.x=lerp(tw.f.x,tw.t.x,e);cam.y=lerp(tw.f.y,tw.t.y,e);if(u>=1)tw=null;else busy=true;dirty=true}
 CL.clusters.forEach(function(c){var tg=c.expanded?1:0;if(c.expT!==tg){c.expT=reduced()?tg:Math.abs(c.expT-tg)<.01?tg:c.expT+(tg-c.expT)*(1-Math.exp(-7*dt));dirty=true;busy=true}});
 var tg2=S.level==='star'?1:0;if(S.starT!==tg2){S.starT=reduced()?tg2:Math.abs(S.starT-tg2)<.01?tg2:S.starT+(tg2-S.starT)*(1-Math.exp(-6.5*dt));dirty=true;busy=true;if(S.starT===0&&TMP&&S.level!=='star'){}}
 if(dirty)render();
 if(busy)schedule();else if(last)last=0}
// ---------- interaction ----------
function cvt(e){var r=svg.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function zoomAt(px,py,f,anim){var nk=clamp(cam.k*f,galaxyFit().k*.8,4),wx=cam.x+(px-W/2)/cam.k,wy=cam.y+(py-H/2)/cam.k;var t={k:nk,x:wx-(px-W/2)/nk,y:wy-(py-H/2)/nk};if(anim)flyTo(t,240);else{cam.k=t.k;cam.x=t.x;cam.y=t.y;tw=null;dirty=true;schedule()}autoLevel()}
function nearestStar(c,maxd){var best=null,bd=1e9;c.stars.forEach(function(s){if(s._op<.5||(s.mastered&&c.expT<.5))return;var d=CL.disp(s),dd=Math.hypot(d.x-cam.x,d.y-cam.y);if(dd<bd){bd=dd;best=s}});return bd<maxd?best:null}
function autoLevel(){var k=cam.k;
 if(S.level==='star'){var st=CL.star[S.star],kf=starFit(st,0).k;if(k<kf*.62&&!S.skill){var c=st.cl;S.skill=null;setLevel('cluster',c.id,null)}return}
 if(S.level==='cluster'){var c2=CL.by[S.subj],ke=kGE(c2),kf2=clusterFit(c2).k;if(k<ke*.95){setLevel('galaxy',null,null);S.subj=c2.id;return}
  if(k>kf2*1.9){var s=nearestStar(c2,Math.max(150,260*(1/k)*2));if(s){buildPlanets(s);setLevel('star',c2.id,s)}}return}
 if(S.level==='galaxy'){var bestc=null,bd=1e9;CL.clusters.forEach(function(c){var b=bbox(clusterPts(c,false)),d=Math.hypot((b.x0+b.x1)/2-cam.x,(b.y0+b.y1)/2-cam.y);if(d<bd){bd=d;bestc=c}});if(bestc&&k>kGE(bestc)*1.3&&bd<900){setLevel('cluster',bestc.id,null)}}}
var drag=null;
svg.addEventListener('pointerdown',function(e){if(e.button!==0)return;var p=cvt(e);drag={x:p.x,y:p.y,cx:cam.x,cy:cam.y,moved:false,tgt:e.target};try{svg.setPointerCapture(e.pointerId)}catch(_){}tw=null});
svg.addEventListener('pointermove',function(e){if(!drag)return;var p=cvt(e),dx=p.x-drag.x,dy=p.y-drag.y;if(!drag.moved&&Math.abs(dx)+Math.abs(dy)<5)return;drag.moved=true;svg.classList.add('drag');cam.x=drag.cx-dx/cam.k;cam.y=drag.cy-dy/cam.k;dirty=true;schedule()});
svg.addEventListener('pointerup',function(e){var d=drag;drag=null;svg.classList.remove('drag');if(!d)return;if(d.moved){autoLevel();return}var t=(d.tgt&&d.tgt.closest)?d.tgt.closest('[data-kind]'):null;activate(t)});
function activate(t){if(!t){if(S.skill)deselect();return}var kind=t.dataset.kind,id=t.dataset.id;
 if(kind==='cluster'){if(S.level==='galaxy')enterCluster(id)}
 else if(kind==='star'){var st=CL.star[id];if(S.level==='galaxy'){enterCluster(st.cl.id);return}if(st.mastered&&!st.cl.expanded)return;if(S.level==='star'&&S.star===id){if(S.skill)deselect();return}enterStar(id)}
 else if(kind==='meta'){var c=CL.by[id];if(S.level==='galaxy')enterCluster(id,true);toggleExpand(c)}
 else if(kind==='planet'){selectSkill(id)}}
svg.addEventListener('keydown',function(e){var t=e.target&&e.target.closest?e.target.closest('[data-kind]'):null;
 if((e.key==='Enter'||e.key===' ')&&t){e.preventDefault();activate(t)}
 else if(e.key==='Escape'){up()}
 else if(e.key==='+'||e.key==='='){zoomAt(W/2,H/2,1.4,true)}else if(e.key==='-'||e.key==='_'){zoomAt(W/2,H/2,1/1.4,true)}
 else if(e.key==='0'){fit()}
 else if(e.key.indexOf('Arrow')===0){e.preventDefault();var s=80/cam.k;cam.x+=e.key==='ArrowRight'?s:e.key==='ArrowLeft'?-s:0;cam.y+=e.key==='ArrowDown'?s:e.key==='ArrowUp'?-s:0;dirty=true;schedule();autoLevel()}});
document.addEventListener('keydown',function(e){var a=document.activeElement||{};if(e.key!=='Escape'||UI.list.classList.contains('open')||svg.contains(a))return;if(/^(SELECT|TEXTAREA)$/.test(a.tagName)||(a.tagName==='INPUT'&&a.type!=='checkbox'&&a.type!=='radio'))return;up()});
svg.addEventListener('wheel',function(e){e.preventDefault();var p=cvt(e);zoomAt(p.x,p.y,Math.exp(-e.deltaY*(e.ctrlKey?.01:.0016)),false)},{passive:false});
function fit(){if(S.level==='galaxy')flyTo(galaxyFit(),700);else if(S.level==='cluster')flyTo(clusterFit(CL.by[S.subj]),700);else flyTo(starFit(CL.star[S.star]),700)}
hud.addEventListener('click',function(e){var b=e.target.closest('[data-act]');if(!b)return;if(b.dataset.act==='expand')toggleExpand(CL.by[S.subj]);else if(b.dataset.act==='up')exitStar()});
function applyFocusables(){var L=S.level;objs.forEach(function(o){var on=false;if(L==='galaxy')on=o.kind==='cluster';else if(L==='cluster'){on=(o.kind==='star'||o.kind==='meta')}else if(L==='star'){on=o.kind==='planet'}o.el.setAttribute('tabindex',on?0:-1);o.el.setAttribute('aria-hidden',on?'false':'true')});
 CL.clusters.forEach(function(c){c.stars.forEach(function(st){if(L==='cluster'){var hidden=st.mastered&&c.expT<.5&&!c.expanded||(!st.unlocked&&!(S.showLocked||ghostA(c)>.5)),own=c.id===S.subj;st.el.setAttribute('tabindex',own&&!hidden?0:-1);st.el.setAttribute('aria-hidden',own&&!hidden?'false':'true')}});
  if(c.meta){var mo=L==='cluster'&&c.id===S.subj&&!c.expanded;c.metaEl.setAttribute('tabindex',mo?0:-1);c.metaEl.setAttribute('aria-hidden',mo?'false':'true');var ch=L==='cluster'&&c.id===S.subj&&c.expanded;c.chip.setAttribute('tabindex',ch?0:-1);c.chip.setAttribute('aria-hidden',ch?'false':'true')}})}
// ---------- toolbar ----------
UI.presets.innerHTML='<button class="btn" data-j="all">Galaxy</button>'+CL.clusters.map(function(c){return '<button class="btn" data-j="'+c.id+'">'+c.name+'</button>'}).join('');
UI.presets.onclick=function(e){var j=e.target.dataset&&e.target.dataset.j;if(!j)return;j==='all'?goGalaxy():enterCluster(j)};
var gl=UI.top.querySelector('#ghost');gl.parentNode.lastChild.textContent=' Show locked stars';gl.onchange=function(){S.showLocked=gl.checked;applyFocusables();dirty=true;schedule()};
UI.top.querySelector('#cmode').onchange=function(){colorMode=UI.colorMode();recolor();var sk=UI.draw.dataset.skill;if(sk)drawer.show(SG.by[sk])};
UI.zoom.querySelector('#zin').onclick=function(){zoomAt(W/2,H/2,1.45,true)};UI.zoom.querySelector('#zout').onclick=function(){zoomAt(W/2,H/2,1/1.45,true)};UI.zoom.querySelector('#zfit').onclick=fit;
UI.top.querySelector('#rm').addEventListener('change',function(){dirty=true;schedule()});
var lbtn=UI.top.querySelector('#listbtn');lbtn.onclick=function(){var o=UI.list.classList.toggle('open');lbtn.setAttribute('aria-pressed',o);lbtn.textContent=o?'🗺 Map view':'☰ List view';if(o)buildList()};
function buildList(){var h='<h2>List view <span class="mut sm">same stars and skills, no map needed</span></h2>';
 CL.clusters.forEach(function(c){h+='<section class="sg-ol"><h3 style="color:'+c.color+'">'+c.name+' <span class="mut sm">'+c.stars.length+' stars · '+c.stars.filter(function(s){return s.unlocked}).length+' unlocked · '+c.solidN+' of '+c.skillsN+' skills solid</span></h3>';
  c.stars.slice().sort(function(a,b){return (a.cx-b.cx)||(a.cy-b.cy)}).forEach(function(st){var tag=st.kind==='locked'?'Locked. Unlocks at '+Math.round(CL.UNLOCK*100)+'% of '+st.need.filter(function(x){return !x.ok}).map(function(x){return x.star.name+' (now '+Math.round(x.have*100)+'%)'}).join(' and '):st.kind==='mastered'?'Mastered (collapsed in the map)':st.kind==='new'?'Unlocked, not started':'In progress, '+starPct(st)+'% solid';
   h+='<details class="sgd-list-star"'+(st.kind==='active'||st.kind==='new'?' open':'')+'><summary><b>'+st.name+'</b> <span class="mut">· '+tag+'</span></summary><button class="btn sm" data-star="'+st.id+'">Open this star in the map</button><ul>'+st.skills.map(function(id){var s=SG.by[id];return '<li><button class="sg-row" data-go="'+id+'"><span class="sg-dot" style="background:'+SG.colorFor(s,colorMode)+'"></span><span class="sg-rn"><b>'+s.name+'</b><span class="mut sm">'+SG.statusText(s)+(s.review?' · review suggested':'')+'</span></span></button></li>'}).join('')+'</ul></details>'});
  h+='</section>'});
 UI.list.innerHTML=h;Array.prototype.forEach.call(UI.list.querySelectorAll('[data-go]'),function(b){b.onclick=function(){closeList();goSkill(b.dataset.go)}});Array.prototype.forEach.call(UI.list.querySelectorAll('[data-star]'),function(b){b.onclick=function(){closeList();enterStar(b.dataset.star)}})}
function closeList(){UI.list.classList.remove('open');lbtn.textContent='☰ List view';lbtn.setAttribute('aria-pressed',false)}
// legend addendum
var lg4=document.createElement('div');lg4.className='sgd-lg4';lg4.innerHTML='<b>Stars and links</b>'+
 '<div><svg width="30" height="26" viewBox="-19 -19 38 38"><circle r="15" fill="#fbbf24" fill-opacity=".8"/><circle r="17" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="60 100" transform="rotate(-90)"/></svg><span>Unlocked star in progress (ring = share of skills Solid)</span></div>'+
 '<div><svg width="30" height="26" viewBox="-19 -19 38 38"><circle r="15" fill="#1b2330" stroke="#a3e635" stroke-width="2"/><circle r="17" fill="none" stroke="#fff" stroke-dasharray="4 4"/></svg><span>Unlocked, not started</span></div>'+
 '<div><svg width="30" height="26" viewBox="-19 -19 38 38"><circle r="13" fill="#0f1a14" stroke="#3fb950" stroke-width="2"/><text y="5" text-anchor="middle" font-size="14" fill="#3fb950" font-weight="700">✓</text></svg><span>Mastered stars collapsed into one group; click to expand</span></div>'+
 '<div><svg width="30" height="26" viewBox="-19 -19 38 38"><circle r="14" fill="#262d36" stroke="#6e7681" stroke-dasharray="2 4"/></svg><span>Locked star (only when zoomed out or “Show locked stars”)</span></div>'+
 '<div><svg width="30" height="10"><line x1="1" y1="5" x2="29" y2="5" stroke="#9fb3d1" stroke-width="2.2"/></svg><span>Solid line: star unlocked</span></div><div><svg width="30" height="10"><line x1="1" y1="5" x2="29" y2="5" stroke="#6e7681" stroke-width="1.6" stroke-dasharray="2 5" stroke-linecap="round"/></svg><span>Dotted: locked, with what it needs</span></div>';
UI.leg.appendChild(lg4);
// orbit
if(SG.orbit){SG.orbit.mountControl(UI.top.querySelector('label.tg'));SG.orbit.on(function(){var st=S.star&&CL.star[S.star];if(st&&S.level==='star'){placePlanets(st)}dirty=true;schedule()});
 SG.orbit.blockers.push(function(){return !!tw||!!S.skill||UI.draw.classList.contains('open')||UI.list.classList.contains('open')||S.starT>0&&S.starT<1})}
function resize(){W=stage.clientWidth;H=stage.clientHeight;svg.setAttribute('viewBox','0 0 '+W+' '+H);dirty=true;schedule()}
new ResizeObserver(resize).observe(stage);
build();resize();var gf=galaxyFit();cam.x=gf.x;cam.y=gf.y;cam.k=gf.k;setLevel('galaxy',null,null);render();
window.__sgd={S:S,cam:cam,CL:CL,counts:counts,enterCluster:enterCluster,enterStar:enterStar,goGalaxy:goGalaxy,toggleExpand:toggleExpand,goSkill:goSkill,flyTo:flyTo,render:render,clusterFit:clusterFit,chartFit:chartFit,galaxyFit:galaxyFit,starFit:starFit,kGE:kGE,deselect:deselect,activate:activate,buildList:buildList,setShowLocked:function(b){gl.checked=b;S.showLocked=b;applyFocusables();dirty=true;schedule()},idle:function(){return !tw&&!raf},up:up,fit:fit,selectSkill:selectSkill};
var q=new URLSearchParams(location.search);setTimeout(function(){if(q.get('skill'))goSkill(q.get('skill'));else if(q.get('star'))enterStar(q.get('star'));else if(q.get('subject'))enterCluster(q.get('subject'));if(q.get('ghost'))gl.click()},150);
})();
