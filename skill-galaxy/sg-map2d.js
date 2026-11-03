/* 2-D orbital map with semantic zoom (galaxy -> system -> cluster -> detail). Pure SVG, no dependencies. EXAMPLE DATA.
   Dense systems (u.dense, e.g. full Math, hundreds of skills) add: domain sectors, band rings, fog/dust nodes, lazy labels and mastery
   layers, focus-only prerequisite edges, and ONE rigid rotation for the whole system (so sectors stay intact while it drifts). */
(function(){
var NS='http://www.w3.org/2000/svg';
function E(n,a,p){var e=document.createElementNS(NS,n);for(var k in a||{})e.setAttribute(k,a[k]);p&&p.appendChild(e);return e}
function starPath(r){var o='';for(var i=0;i<10;i++){var a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;o+=(i?'L':'M')+(q*Math.cos(a)).toFixed(1)+','+(q*Math.sin(a)).toFixed(1)}return o+'Z'}
function sector(ri,ro,a0,a1){var c=Math.cos,s=Math.sin,lg=(a1-a0)>Math.PI?1:0;return 'M'+(ro*c(a0)).toFixed(1)+','+(ro*s(a0)).toFixed(1)+'A'+ro+','+ro+' 0 '+lg+' 1 '+(ro*c(a1)).toFixed(1)+','+(ro*s(a1)).toFixed(1)+'L'+(ri*c(a1)).toFixed(1)+','+(ri*s(a1)).toFixed(1)+'A'+ri+','+ri+' 0 '+lg+' 0 '+(ri*c(a0)).toFixed(1)+','+(ri*s(a0)).toFixed(1)+'Z'}
function createMap2D(root,opt){
 opt=opt||{};var mode=opt.mode||'world',colorMode=opt.colorMode||'tier',showGhost=!!opt.showGhost;
 var svg=E('svg',{class:'sgmap',tabindex:0,role:'application','aria-label':'Skill map. Arrow keys pan, plus and minus zoom, zero fits, Tab moves between skills, Enter opens details, Escape clears the selection. The list view has every skill.'});root.appendChild(svg);
 var defs=E('defs',{},svg);
 SG.SUBJ.forEach(function(u){var g=E('radialGradient',{id:'sun-'+u.id},defs);E('stop',{offset:'0',['stop-color']:'#fff','stop-opacity':.95},g);E('stop',{offset:'.35','stop-color':u.color,'stop-opacity':.95},g);E('stop',{offset:'1','stop-color':u.color,'stop-opacity':.05},g)});
 var world=E('g',{},svg),gBr=E('g',{class:'bridges'}),systems=[],nodeEl={},edgeEl=[],pos={},wpos={},cam={x:0,y:0,k:.4},sel=null,level='galaxy',anim=null,revealAll=false,denseOf={},detailList=[],peeked={},lazyEdges=[];
 var list=mode==='world'?SG.SUBJ:SG.SUBJ.filter(function(u){return u.id===opt.subject});
 var anyDense=list.some(function(u){return u.dense});
 var LV=anyDense?[.30,.9,1.8]:[.45,1.05,2.1];
 list.forEach(function(u){
  var lp=SG.layout(u),cx=mode==='world'?u.cx:0,cy=mode==='world'?u.cy:0,g=E('g',{class:'sys'+(u.dense?' dense':''),'data-subj':u.id,transform:'translate('+cx+','+cy+')'},world),dn=!!u.dense;
  u._c={x:cx,y:cy};var OR=SG.outerR(u),la=SG.labelAngle(u),sysO={u:u,g:g,th:0,rl:[]};
  if(dn){ // zone labels (system level) and band labels (cluster/detail) sit on the seam at the top; both are counter-rotation free because they are not in the rotating group
   for(var t=0;t<=u.tierMax;t++){E('circle',{class:'ringc'+(t&&u.bands[t].zone!==u.bands[t-1].zone?' zonec':''),r:SG.ringR(t,u)},g);var bl=E('text',{class:'ringlbl band','text-anchor':'middle',x:0,y:-SG.ringR(t,u)+4},g);bl.textContent=u.tiers[t]}
   u.zones.forEach(function(z){var ts=[];u.bands.forEach(function(b,i){if(b.zone===z.id)ts.push(i)});var r0=SG.ringR(ts[0],u),r1=SG.ringR(ts[ts.length-1],u),zl=E('text',{class:'zonelbl','text-anchor':'start',x:14,y:-(r0+r1)/2+4},g);zl.textContent=z.short||z.name})
  }else for(var t=0;t<=u.tierMax;t++){E('circle',{class:'ringc',r:SG.ringR(t,u)},g);var tl=E('text',{class:'ringlbl','text-anchor':'middle',x:SG.ringR(t,u)*Math.cos(la),y:SG.ringR(t,u)*Math.sin(la)+4},g);tl.textContent=u.tiers[t]}
  var sunG=E('g',{class:'sun',tabindex:mode==='world'?0:-1,role:'button','aria-label':u.name+' system, '+u.skills.length+' skills. Press Enter to zoom in.'},g);
  var started=u.started,SR=dn?60:34;
  E('circle',{r:SR,fill:'url(#sun-'+u.id+')',opacity:started?1:.35},sunG);
  E('circle',{r:SR+12,fill:'none',stroke:'#fff','stroke-opacity':.14,'stroke-width':3},sunG);
  var done=(u.count.solid+u.count.mastered)/u.skills.length;if(done>0)E('circle',{r:SR+12,fill:'none',stroke:u.color,'stroke-width':4,pathLength:100,'stroke-dasharray':(done*100).toFixed(1)+' 100',transform:'rotate(-90)','stroke-linecap':'round'},sunG);
  var tx=E('text',{class:'sun-t',y:dn?0:OR+40},sunG);var a=E('tspan',{x:0,dy:dn?'-.1em':0},tx);a.textContent=u.name;var b=E('tspan',{class:'sun-s',x:0,dy:'1.45em'},tx);
  b.textContent=started?(u.count.solid+u.count.mastered)+' of '+u.skills.length+' solid · '+u.count.available+' ready':'Not started · '+u.count.available+' ready';
  if(dn){tx.setAttribute('class','sun-t dn')}
  sunG.addEventListener('click',function(e){e.stopPropagation();if(mode==='world')api.focusSubject(u.id);opt.onSun&&opt.onSun(u.id)});
  sunG.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();sunG.dispatchEvent(new Event('click'))}});
  var rot=g,gDens=null;
  if(dn){rot=E('g',{class:'rot'},g);gDens=E('g',{class:'dens'},rot);sysO.rot=rot}
  var gE=E('g',{class:'edges'},rot),gN=E('g',{class:'nodes'},rot),gP=E('g',{class:'portals'},g);
  if(dn){ // domain sectors: faint colour wedge per domain and zone, brightness = how much of it the learner has made Solid
   var ords=u.hints.domainOrder;ords.forEach(function(d){var D=u._D[d];
    u.zones.forEach(function(z){var ts=[];u.bands.forEach(function(bb,i){if(bb.zone===z.id)ts.push(i)});var ri=SG.ringR(ts[0],u)-19,ro=SG.ringR(ts[ts.length-1],u)+(u._T[ts[ts.length-1]]||0)+19,L=u.skills.filter(function(s){return s.domain===d&&u.bands[s.tier].zone===z.id});if(!L.length)return;
     var sol=L.filter(function(s){return s.m>=SG.TH.solid}).length/L.length,pth=E('path',{d:sector(ri,ro,D.a0,D.a1),fill:D.hue,'fill-opacity':(.05+.30*sol).toFixed(3),stroke:D.hue,'stroke-opacity':.25,'stroke-width':1,'vector-effect':'non-scaling-stroke','data-d':d},gDens);var ti=E('title',{},pth);ti.textContent=D.name+' · '+z.name+': '+Math.round(sol*100)+'% Solid or better'});
    var ln=E('line',{x1:SG.ringR(0,u)*Math.cos(D.a0-.012)*.62,y1:SG.ringR(0,u)*Math.sin(D.a0-.012)*.62,x2:(OR+30)*Math.cos(D.a0-.012),y2:(OR+30)*Math.sin(D.a0-.012),stroke:'#fff','stroke-opacity':.06},gDens)});
   // domain stars: a ring of small stars around the sun (hub), plus a name on the outer rim
   var gS=E('g',{class:'dstars'},g);
   ords.forEach(function(d){var D=u._D[d],r=7+1.5*Math.sqrt(D.count),sg=E('g',{class:'dstar',tabindex:0,role:'button','aria-label':D.name+' domain star, '+D.count+' skills. Press Enter to zoom to it.'},gS),L=u.skills.filter(function(s){return s.domain===d}),sol=L.filter(function(s){return s.m>=SG.TH.solid}).length/L.length;
    E('circle',{r:r+7,fill:D.hue,opacity:.12+.25*sol},sg);E('path',{d:starPath(r),fill:D.hue,'fill-opacity':.55+.4*sol,stroke:'#fff','stroke-opacity':.35,'stroke-width':1},sg);
    var lt=E('text',{class:'dstar-t','text-anchor':'middle'},gS),t1=E('tspan',{},lt),t2=E('tspan',{class:'dstar-s',dy:'1.35em'},lt);t1.textContent=D.short;t2.textContent=D.count+' skills · '+Math.round(sol*100)+'% solid';
    var tt=E('title',{},sg);tt.textContent=D.name;
    sysO.rl.push({d:d,star:sg,t:lt,t1:t1,t2:t2,a:D.mid,rs:u._starR,ro:OR+120});
    function go(e){e.stopPropagation();api.focusDomain(d,u.id)}sg.addEventListener('click',go);lt.style.cursor='pointer';lt.addEventListener('click',go);sg.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go(e)}})})}
  u.skills.forEach(function(s){pos[s.id]=lp[s.id];wpos[s.id]={x:cx+lp[s.id].x,y:cy+lp[s.id].y};if(dn)denseOf[s.id]=sysO});
  sysO.gE=gE;sysO.gN=gN;sysO.gP=gP;systems.push(sysO);
 });
 world.appendChild(gBr);
 function sysOf(id){return systems.filter(function(s){return s.u.id===SG.by[id].subj})[0]}
 // world position of a node (dense nodes sit inside the rotating group)
 function W(id){var b=denseOf[id];if(b){var l=b.u._lp[id],c=Math.cos(b.th),s=Math.sin(b.th),w=wpos[id];w.x=b.u._c.x+l.x*c-l.y*s;w.y=b.u._c.y+l.x*s+l.y*c}return wpos[id]}
 // edges (small systems draw them all; dense systems draw only the focused skill's, see lazyEdgesFor)
 var edgeIdx={};SG.edges.forEach(function(e){edgeIdx[e.from+'>'+e.to]=e});
 SG.edges.forEach(function(e){
  var A=SG.by[e.from],B=SG.by[e.to];
  if(!wpos[e.from]&&!wpos[e.to])return;
  if(SG.sub[A.subj].dense&&SG.sub[A.subj]===SG.sub[B.subj])return;
  if(wpos[e.from]&&wpos[e.to]){
   var p1=wpos[e.from],p2=wpos[e.to],d;
   if(!e.cross){var sys=sysOf(e.from),c=sys.u._c;d='M'+(p1.x-c.x)+','+(p1.y-c.y)+'L'+(p2.x-c.x)+','+(p2.y-c.y);var path=E('path',{class:'edge '+e.state+(e.done?' done':''),d:d,'data-from':e.from,'data-to':e.to},sys.gE);edgeEl.push({e:e,el:path,kind:'in',c:c})}
   else{var dx=p2.x-p1.x,dy=p2.y-p1.y,L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L,off=L*.16,mx=(p1.x+p2.x)/2+nx*off,my=(p1.y+p2.y)/2+ny*off;
    var path2=E('path',{class:'edge cross '+e.state+(e.done?' done':''),d:'M'+p1.x+','+p1.y+'Q'+mx+','+my+' '+p2.x+','+p2.y,'data-from':e.from,'data-to':e.to},gBr);    var bl=E('text',{class:'bridgelbl',x:(p1.x+p2.x)/4+mx/2,y:(p1.y+p2.y)/4+my/2},gBr);bl.textContent='↔ '+A.name+' → '+B.name;edgeEl.push({e:e,el:path2,kind:'cross',lbl:bl})}
  }else if(mode==='system'){ // portal stub for cross-system prerequisites
   var here=wpos[e.to]||wpos[e.from],other=wpos[e.to]?A:B,hid=wpos[e.to]?e.to:e.from,hu=SG.sub[SG.by[hid].subj],sys2=systems[0],pe0=portalEnd(here,hu),ex=pe0.x,ey=pe0.y;
   var pe=E('path',{class:'edge cross '+e.state,d:'M'+here.x+','+here.y+'L'+ex+','+ey,'data-from':e.from,'data-to':e.to},sys2.gP);var portalSign=ex>0?1:-1;
   var pg=E('g',{class:'portal',tabindex:0,role:'button',style:'cursor:pointer','aria-label':(wpos[e.to]?'Prerequisite from ':'Unlocks in ')+SG.sub[other.subj].name+': '+other.name},sys2.gP);
   E('rect',{x:ex-5,y:ey-5,width:10,height:10,transform:'rotate(45 '+ex+' '+ey+')',fill:'#c4b5fd'},pg);
   var pt=E('text',{class:'bridgelbl',x:ex+(ex>0?10:-10),y:ey+4,style:'text-anchor:'+(ex>0?'start':'end')+';opacity:1'},pg);pt.textContent=(wpos[e.to]?'from ':'to ')+SG.sub[other.subj].name+': '+other.name;
   edgeEl.push({e:e,el:pe,kind:'portal',here:hid,rect:pg.querySelector('rect'),txt:pt,sign:portalSign});
   pg.addEventListener('click',function(ev){ev.stopPropagation();opt.onPortal&&opt.onPortal(other.subj,other.id)});
   pg.addEventListener('keydown',function(ev){if(ev.key==='Enter'){pg.dispatchEvent(new Event('click'))}});
  }
 });
 function portalEnd(h,u){if(u.dense){var an=Math.atan2(h.y,h.x),R=SG.outerR(u)+70;return{x:R*Math.cos(an),y:R*Math.sin(an)}}var an2=Math.atan2(h.y,h.x);return{x:h.x+Math.cos(an2)*70,y:h.y+Math.sin(an2)*70}}
 // requirement badges on in-system edges (detail level)
 edgeEl.forEach(function(o){if(o.e.cross)return;var s=SG.by[o.e.to],P=wpos[o.e.from],Q=wpos[o.e.to],sys=sysOf(o.e.to),c=sys.u._c;
  var t=E('text',{class:'reqb',x:(P.x+Q.x)/2-c.x,y:(P.y+Q.y)/2-c.y},sys.gE);t.textContent=o.e.state==='ghost'?'needs 55%':'55% ✓';o.el._rb=t});
 // nodes
 function ariaOf(s,sys){return s.name+', '+SG.sub[s.subj].name+', '+sys.u.tiers[s.tier]+'. '+SG.statusText(s)+(s.review?', review suggested':'')+'. '+(s.needs.length?'Prerequisites: '+s.needs.map(function(n){return SG.by[n.id].name+(n.ok?' met':' not yet')}).join(', '):'No prerequisites.')}
 function isHot(s){return s.state==='available'||s.state==='started'||s.state==='learning'||s.review}
 function buildNode(s,sys){
  var p=pos[s.id],hot=isHot(s);
  var g=E('g',{class:'node st-'+s.state+(hot?' hot':'')+(s.state==='locked'?' lk':''),transform:'translate('+p.x+','+p.y+')',tabindex:0,role:'button','data-id':s.id,'aria-label':ariaOf(s,sys)},sys.gN);
  E('circle',{r:SG.radius(s)+14,fill:'transparent'},g);
  var pl=E('g',{class:'planet'},g);pl.innerHTML=SG.planetSVG(s,colorMode);
  if(SG.dimSVG){var dw=E('g',{class:'dimwrap'},g);dw.innerHTML=SG.dimSVG(s)}
  E('circle',{class:'ring-sel',r:SG.radius(s)+(SG.dimSVG?24:13),fill:'none',stroke:'#fff','stroke-width':2,'stroke-dasharray':'3 3'},g);
  var tx=E('text',{class:'nlabel','text-anchor':'middle',y:SG.radius(s)+(SG.dimSVG?35:25)},g),a=E('tspan',{x:0},tx);a.textContent=s.name;var b=E('tspan',{class:'pc',x:0,dy:'1.25em'},tx);b.textContent=s.state==='locked'?'locked':s.state==='available'?'ready':SG.pct(s.m)+'%';
  wire(g,s);nodeEl[s.id]=g;
 }
 function wire(g,s){
  g.addEventListener('click',function(ev){ev.stopPropagation();api.select(s.id,{focus:true})});
  g.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();ev.stopPropagation();api.select(s.id,{focus:true})}});
  g.addEventListener('focus',function(){if(!ev_mouse)ensureVisible(s.id)});
 }
 // dense nodes: a "dust" speck while fogged, a full planet once started / available / near the learner's frontier; label and mastery layers are built lazily when close
 function setDust(s,g){while(g.firstChild)g.removeChild(g.firstChild);g.setAttribute('class','node dn fog');g.removeAttribute('tabindex');g.removeAttribute('role');g.removeAttribute('aria-label');g._full=false;g._detail=false;
  E('circle',{class:'dust',r:3.1,fill:'#66748a'},g)}
 function setFull(s,g,sys){while(g.firstChild)g.removeChild(g.firstChild);var hot=isHot(s);
  g.setAttribute('class','node dn st-'+s.state+(hot?' hot':'')+(s.state==='locked'?' lk':'')+(sel===s.id?' sel':''));g.setAttribute('tabindex',hot?0:-1);g.setAttribute('role','button');g.setAttribute('aria-label',ariaOf(s,sys));
  E('circle',{r:SG.radius(s)+13,fill:'transparent'},g);var up=E('g',{class:'up'},g);var pl=E('g',{class:'planet'},up);pl.innerHTML=SG.planetSVG(s,colorMode);
  E('circle',{class:'ring-sel',r:SG.radius(s)+24,fill:'none',stroke:'#fff','stroke-width':2,'stroke-dasharray':'3 3'},up);
  if(!g._wired){wire(g,s);g._wired=true}g._full=true;g._detail=false;g._up=up}
 var ev_mouse=false;svg.addEventListener('pointerdown',function(){ev_mouse=true;setTimeout(function(){ev_mouse=false},300)});
 systems.forEach(function(sys){
  if(sys.u.dense){sys.u.skills.forEach(function(s){var p=pos[s.id],g=E('g',{transform:'translate('+p.x.toFixed(1)+','+p.y.toFixed(1)+')','data-id':s.id},sys.gN);nodeEl[s.id]=g;g._s=s;g._sys=sys;if(s.fog)setDust(s,g);else setFull(s,g,sys)});return}
  sys.u.skills.slice().sort(function(a,b){return a.tier-b.tier||pos[a.id].a-pos[b.id].a}).forEach(function(s){buildNode(s,sys)})});
 function trunc(n){return n.length>26?n.slice(0,24)+'…':n}
 function ensureDetail(id){var g=nodeEl[id],s=g._s||SG.by[id];if(!g||!g._full||g._detail)return;g._detail=true;var up=g._up,r=SG.radius(s);
  var dw=E('g',{class:'dimwrap'},up);dw.innerHTML=SG.dimSVG?SG.dimSVG(s):'';
  var odd=(s.tier+(pos[s.id].r>SG.ringR(s.tier,g._sys.u)+1?1:0))%2;var tx=E('text',{class:'nlabel','text-anchor':'middle',y:r+(odd?32:23)},up),a=E('tspan',{x:0},tx);a.textContent=trunc(s.name);var b=E('tspan',{class:'pc',x:0,dy:'1.2em'},tx);b.textContent=s.state==='locked'?'locked':s.state==='available'?'ready':SG.pct(s.m)+'%';
  var tt=E('title',{},g);tt.textContent=s.name+' — '+SG.statusText(s);detailList.push(id)}
 var pendingDetail=false;function schedDetail(){if(pendingDetail)return;pendingDetail=true;requestAnimationFrame(function(){pendingDetail=false;refreshDetail()})}
 function refreshDetail(){if(level!=='cluster'&&level!=='detail')return;var sz=size(),m=70,w=sz.w-offsetW();
  systems.forEach(function(sys){if(!sys.u.dense)return;sys.u.skills.forEach(function(s){var g=nodeEl[s.id];if(!g._full)return;var q=W(s.id),sx=q.x*cam.k+cam.x,sy=q.y*cam.k+cam.y;if(sx>-m&&sx<w+m&&sy>-m&&sy<sz.h+m)ensureDetail(s.id)})});uprightApply()}
 function uprightApply(){systems.forEach(function(sys){if(!sys.u.dense)return;var d=(-sys.th*180/Math.PI).toFixed(2);detailList.forEach(function(id){var g=nodeEl[id];if(g._sys===sys&&g._up)g._up.setAttribute('transform','rotate('+d+')')})})}

 // slow idle orbit (Prototype C): small systems rotate each tier by its own angle from the shared SG.orbit clock; DENSE systems rotate rigidly as one group
 var base={};systems.forEach(function(sys){if(sys.u.dense)return;sys.u.skills.forEach(function(s){var l=sys.u._lp[s.id];base[s.id]={r:Math.hypot(l.x,l.y),a:Math.atan2(l.y,l.x),t:s.tier,s:s,sys:sys}})});
 var lastDn=0,pinned=[];edgeEl.forEach(function(o){if(o.e.cross||o.kind==='portal'){if(denseOf[o.e.from])pinned.push(o.e.from);if(denseOf[o.e.to])pinned.push(o.e.to)}});
 function denseApply(force){var now=performance.now();if(!force&&now-lastDn<60)return;lastDn=now;
  systems.forEach(function(sys){if(!sys.u.dense)return;var O=SG.orbit,th=O?O.ang(2):0;sys.th=th;sys.rot.setAttribute('transform','rotate('+(th*180/Math.PI).toFixed(3)+')');var u=sys.u,R=u._starR,OR=SG.outerR(u),c=Math.cos(th),sn=Math.sin(th);
   sys.rl.forEach(function(o){var a=o.a+th,x=R*Math.cos(a),y=R*Math.sin(a);o.star.setAttribute('transform','translate('+x.toFixed(1)+','+y.toFixed(1)+')');
    var xo=(o.ro*Math.cos(a)).toFixed(1),yo=(o.ro*Math.sin(a)).toFixed(1);o.t.setAttribute('x',xo);o.t.setAttribute('y',yo);o.t1.setAttribute('x',xo);o.t2.setAttribute('x',xo)})});
  pinned.forEach(function(id){W(id)});if(detailList.length)uprightApply()}
 function orbitApply(){var O=SG.orbit;denseApply(false);
  Object.keys(base).forEach(function(id){var b=base[id],th=O.ang(b.t),a=b.a+th,x=b.r*Math.cos(a),y=b.r*Math.sin(a),c=b.sys.u._c;nodeEl[id].setAttribute('transform','translate('+x.toFixed(2)+','+y.toFixed(2)+')');wpos[id].x=c.x+x;wpos[id].y=c.y+y});
  edgeEl.forEach(function(o){if(o.kind==='dn')return;var f=W(o.e.from),g=W(o.e.to);
   if(o.kind==='in'){var c=o.c;o.el.setAttribute('d','M'+(f.x-c.x).toFixed(2)+','+(f.y-c.y).toFixed(2)+'L'+(g.x-c.x).toFixed(2)+','+(g.y-c.y).toFixed(2));if(o.el._rb){o.el._rb.setAttribute('x',((f.x+g.x)/2-c.x).toFixed(2));o.el._rb.setAttribute('y',((f.y+g.y)/2-c.y).toFixed(2))}}
   else if(o.kind==='cross'){var dx=g.x-f.x,dy=g.y-f.y,L=Math.hypot(dx,dy),nx=-dy/L,ny=dx/L,off=L*.16,mx=(f.x+g.x)/2+nx*off,my=(f.y+g.y)/2+ny*off;o.el.setAttribute('d','M'+f.x.toFixed(2)+','+f.y.toFixed(2)+'Q'+mx.toFixed(2)+','+my.toFixed(2)+' '+g.x.toFixed(2)+','+g.y.toFixed(2));o.lbl.setAttribute('x',((f.x+g.x)/4+mx/2).toFixed(2));o.lbl.setAttribute('y',((f.y+g.y)/4+my/2).toFixed(2))}
   else if(o.kind==='portal'){var h=W(o.here),pe=portalEnd(h,SG.sub[SG.by[o.here].subj]),ex=pe.x,ey=pe.y;o.el.setAttribute('d','M'+h.x.toFixed(2)+','+h.y.toFixed(2)+'L'+ex.toFixed(2)+','+ey.toFixed(2));o.rect.setAttribute('x',ex-5);o.rect.setAttribute('y',ey-5);o.rect.setAttribute('transform','rotate(45 '+ex+' '+ey+')');o.txt.setAttribute('x',ex+o.sign*10);o.txt.setAttribute('y',ey+4)}
  })}
 var offOrbit=null;
 if(window.SG&&SG.orbit){SG.orbit.blockers.push(blocked);offOrbit=SG.orbit.on(orbitApply);if(SG.orbit.phase)orbitApply()}
 denseApply(true);
 function blocked(){return !!sel}
 // camera
 function size(){var r=svg.getBoundingClientRect();return{w:r.width,h:r.height}}
 function offsetW(){return opt.drawerWidth?opt.drawerWidth():0}
 function apply(){world.setAttribute('transform','translate('+cam.x+','+cam.y+') scale('+cam.k+')');svg.style.setProperty('--ik',(1/cam.k).toFixed(4));if(anyDense)svg.style.setProperty('--ns',Math.max(1,Math.min(2.4,.55/cam.k)).toFixed(2));
  var l=cam.k<LV[0]?'galaxy':cam.k<LV[1]?'system':cam.k<LV[2]?'cluster':'detail';if(mode==='system'&&l==='galaxy')l='system';
  if(l!==level){svg.classList.remove('lv-'+level);level=l}svg.classList.add('lv-'+level);if(anyDense&&(l==='cluster'||l==='detail'))schedDetail();opt.onLevel&&opt.onLevel(info())}
 function info(){var sz=size(),cw=(sz.w-offsetW())/2,cxw=(cw-cam.x)/cam.k,cyw=(sz.h/2-cam.y)/cam.k,best=null,bd=1e9;
  systems.forEach(function(s){var d=Math.hypot(cxw-s.u._c.x,cyw-s.u._c.y);if(d<bd){bd=d;best=s}});
  var out={level:level,k:cam.k,subject:null,tier:null,domain:null,skill:sel};
  if(best&&bd<SG.outerR(best.u)+160&&level!=='galaxy'){out.subject=best.u.id;if(level==='cluster'||level==='detail'){var bt=0,bdd=1e9;for(var t=0;t<=best.u.tierMax;t++){var dd=Math.abs(bd-SG.ringR(t,best.u));if(dd<bdd){bdd=dd;bt=t}}out.tier=bt;
   if(best.u.dense){var an=Math.atan2(cyw-best.u._c.y,cxw-best.u._c.x)-best.th,tw=2*Math.PI;an=((an%tw)+tw)%tw;var bestD=null,bm=1e9;Object.keys(best.u._D).forEach(function(k){var D=best.u._D[k],mid=((D.mid%tw)+tw)%tw,dd2=Math.abs(Math.atan2(Math.sin(an-mid),Math.cos(an-mid)));if(dd2<bm){bm=dd2;bestD=k}});out.domain=bestD}}}
  return out}
 function setCam(c){cam.x=c.x;cam.y=c.y;cam.k=Math.max(.12,Math.min(5,c.k));apply()}
 function animateTo(c,ms){cancelAnimationFrame(anim);if(SG.reduced()||document.body.classList.contains('rm')||!ms){setCam(c);return}
  var s={x:cam.x,y:cam.y,k:cam.k},t0=performance.now();
  (function f(now){var u=Math.min(1,(now-t0)/ms),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
   // zoom-pan interpolation in log-k so the focus point stays steady
   var k=s.k*Math.pow(c.k/s.k,e);setCam({x:s.x+(c.x-s.x)*e,y:s.y+(c.y-s.y)*e,k:k});if(u<1)anim=requestAnimationFrame(f)})(t0)}
 function inset(){return opt.bottomInset?opt.bottomInset():0}
 function topIn(){return opt.topInset?opt.topInset():0}
 function viewFor(cx,cy,k){var sz=size();return{x:(sz.w-offsetW())/2-cx*k,y:topIn()+(sz.h-inset()-topIn())/2-cy*k,k:k}}
 function fitRect(x0,y0,x1,y1,pad){var sz=size(),w=sz.w-offsetW()-(pad||60)*2,h=sz.h-inset()-topIn()-(pad||60)*2,k=Math.min(w/(x1-x0),h/(y1-y0));return viewFor((x0+x1)/2,(y0+y1)/2,Math.min(k,2.4))}
 function bounds(us){var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;us.forEach(function(u){var R=SG.outerR(u)+(u.dense?210:90);x0=Math.min(x0,u._c.x-R);x1=Math.max(x1,u._c.x+R);y0=Math.min(y0,u._c.y-R);y1=Math.max(y1,u._c.y+R+(u.dense?0:70))});return[x0,y0,x1,y1]}
 function ensureVisible(id){var w=W(id),sz=size(),sx=w.x*cam.k+cam.x,sy=w.y*cam.k+cam.y,m=90;
  if(sx<m||sx>sz.w-offsetW()-m||sy<m||sy>sz.h-m){animateTo(viewFor(w.x,w.y,Math.max(cam.k,.9)),380)}}
 // interactions
 var drag=null;
 svg.addEventListener('pointerdown',function(e){if(e.target.closest&&(e.target.closest('.node')||e.target.closest('.sun')||e.target.closest('.portal')||e.target.closest('.dstar')))return;drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,moved:false};svg.setPointerCapture(e.pointerId);cancelAnimationFrame(anim)});
 svg.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)drag.moved=true;if(drag.moved){cam.x=drag.cx+dx;cam.y=drag.cy+dy;apply()}});
 svg.addEventListener('pointerup',function(e){if(drag&&!drag.moved&&sel)api.deselect();drag=null});
 svg.addEventListener('wheel',function(e){e.preventDefault();cancelAnimationFrame(anim);var r=svg.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top,f=Math.exp(-e.deltaY*(e.ctrlKey?.012:.0016)),nk=Math.max(.12,Math.min(5,cam.k*f)),ff=nk/cam.k;cam.x=mx-(mx-cam.x)*ff;cam.y=my-(my-cam.y)*ff;cam.k=nk;apply()},{passive:false});
 svg.addEventListener('keydown',function(e){if(e.target!==svg)return;var s=70,h=true;
  if(e.key==='ArrowLeft')cam.x+=s;else if(e.key==='ArrowRight')cam.x-=s;else if(e.key==='ArrowUp')cam.y+=s;else if(e.key==='ArrowDown')cam.y-=s;
  else if(e.key==='+'||e.key==='=')api.zoomBy(1.4);else if(e.key==='-'||e.key==='_')api.zoomBy(1/1.4);else if(e.key==='0')api.fit();else if(e.key==='Escape')api.deselect();else h=false;
  if(h){e.preventDefault();apply()}});
 // selection
 function chain(id,maxDepth){var seen={},st=[[id,0]];seen[id]=1;while(st.length){var cur=st.pop(),c=SG.by[cur[0]];if(maxDepth!=null&&cur[1]>=maxDepth)continue;c.pre.forEach(function(p){if(!seen[p]){seen[p]=1;st.push([p,cur[1]+1])}})}return seen}
 function lazyEdgesFor(id){ // dense system: draw only the prerequisite chain (3 steps back) and what the skill unlocks (1 step) for the focused skill
  var s=SG.by[id],sys=denseOf[id];if(!sys)return;var C=chain(id,3),keep=[];
  Object.keys(C).forEach(function(k){SG.by[k].pre.forEach(function(p){if(C[p])keep.push(edgeIdx[p+'>'+k])})});
  s.dep.forEach(function(d){keep.push(edgeIdx[id+'>'+d])});
  var c=sys.u._c;
  keep.forEach(function(e){if(!e)return;var P=pos[e.from],Q=pos[e.to];if(!P||!Q||SG.by[e.from].subj!==s.subj||SG.by[e.to].subj!==s.subj)return;
   var path=E('path',{class:'edge '+e.state+(e.done?' done':'')+' hl',d:'M'+P.x.toFixed(1)+','+P.y.toFixed(1)+'L'+Q.x.toFixed(1)+','+Q.y.toFixed(1),'data-from':e.from,'data-to':e.to},sys.gE);var o={e:e,el:path,kind:'dn'};
   if(e.to===id||e.from===id){var t=E('text',{class:'reqb',x:((P.x+Q.x)/2).toFixed(1),y:((P.y+Q.y)/2).toFixed(1)},sys.gE);t.textContent=e.state==='ghost'?'needs 55%':'55% ✓';o.rb=t;path._rb=t}
   edgeEl.push(o);lazyEdges.push(o)});
  return C}
 function clearLazy(){lazyEdges.forEach(function(o){o.el.remove();o.rb&&o.rb.remove()});edgeEl=edgeEl.filter(function(o){return o.kind!=='dn'});lazyEdges=[]}
 function peek(ids){ids.forEach(function(k){var g=nodeEl[k];if(g&&g._sys&&!g._full){setFull(g._s,g,g._sys);peeked[k]=1}})}
 var api={svg:svg,
  fit:function(){var us=list;var b=bounds(us);animateTo(fitRect(b[0],b[1],b[2],b[3],40),650)},
  focusSubject:function(id){var u=SG.sub[id];if(!u._c)return;var R=SG.outerR(u)+(u.dense?210:90);animateTo(fitRect(u._c.x-R,u._c.y-R,u._c.x+R,u._c.y+R+(u.dense?0:50),30),650)},
  focusTier:function(id,t){var u=SG.sub[id],R=SG.ringR(t,u);animateTo(viewFor(u._c.x+R*Math.cos(u.a0*Math.PI/180),u._c.y+R*Math.sin(u.a0*Math.PI/180),1.5),600)},
  focusDomain:function(d,uid){var sys=systems.filter(function(s){return s.u.dense&&(!uid||s.u.id===uid)})[0];if(!sys)return;var u=sys.u,D=u._D[d];if(!D)return;var xs=[],ys=[],rs=[SG.ringR(0,u)-30,SG.outerR(u)+60],as=[D.a0,D.mid,D.a1];
   rs.forEach(function(r){as.forEach(function(a){var q=a+sys.th;xs.push(u._c.x+r*Math.cos(q));ys.push(u._c.y+r*Math.sin(q))})});
   animateTo(fitRect(Math.min.apply(null,xs),Math.min.apply(null,ys),Math.max.apply(null,xs),Math.max.apply(null,ys),30),700)},
  focusZone:function(zid,uid){var sys=systems.filter(function(s){return s.u.dense&&(!uid||s.u.id===uid)})[0];if(!sys)return;var u=sys.u,ts=[];u.bands.forEach(function(b,i){if(b.zone===zid)ts.push(i)});var r0=SG.ringR(ts[0],u),r1=SG.ringR(ts[ts.length-1],u)+60;if(ts[0]===0){animateTo(fitRect(u._c.x-r1,u._c.y-r1,u._c.x+r1,u._c.y+r1,30),700);return}var a=-Math.PI/2+sys.th,rm=(r0+r1)/2;animateTo(viewFor(u._c.x+rm*Math.cos(a),u._c.y+rm*Math.sin(a),Math.min(.9,1500/(r1-r0+400)*.45)),700)},
  focusSkill:function(id,k){var w=W(id);if(!w)return;animateTo(viewFor(w.x,w.y,k||Math.max(cam.k,1.6)),560)},
  zoomBy:function(f){var sz=size(),mx=(sz.w-offsetW())/2,my=sz.h/2,nk=Math.max(.12,Math.min(5,cam.k*f)),ff=nk/cam.k;animateTo({x:mx-(mx-cam.x)*ff,y:my-(my-cam.y)*ff,k:nk},260)},
  has:function(id){return !!nodeEl[id]},
  setReveal:function(b){revealAll=!!b;Object.keys(denseOf).forEach(function(id){var g=nodeEl[id],s=g._s;if(!s.fog)return;if(revealAll){if(!g._full)setFull(s,g,g._sys)}else if(g._full&&!peeked[id]&&sel!==id){setDust(s,g)}});svg.classList.toggle('revealed',revealAll);apply()},
  reveal:function(){return revealAll},
  select:function(id,o){if(!nodeEl[id])return;if(sel&&nodeEl[sel])nodeEl[sel].classList.remove('sel');sel=id;var dnSel=!!denseOf[id],C;
   if(dnSel){clearLazy();C=lazyEdgesFor(id);var around=Object.keys(C).concat(SG.by[id].dep);peek(around)}else C=chain(id);
   Object.keys(nodeEl).forEach(function(k){var hl=C[k]||SG.by[id].dep.indexOf(k)>=0;nodeEl[k].classList.toggle('hl',!!hl)});nodeEl[id].classList.add('sel');if(denseOf[id]){if(!nodeEl[id]._full)peek([id]);nodeEl[id].classList.add('sel')}
   edgeEl.forEach(function(o2){if(o2.kind==='dn'){return}var hl=(C[o2.e.to]&&C[o2.e.from])||o2.e.from===id;o2.el.classList.toggle('hl',!!hl)});
   svg.classList.add('has-sel');if(dnSel&&level!=='cluster'&&level!=='detail'&&!(o&&o.focus))schedDetail();opt.onSelect&&opt.onSelect(SG.by[id]);
   if(dnSel){ensureDetailNow(id)}
   if(o&&o.focus){var w=W(id);animateTo(viewFor(w.x,w.y,Math.max(cam.k,1.5)),520)}else apply()},
  deselect:function(){if(sel&&nodeEl[sel])nodeEl[sel].classList.remove('sel');sel=null;Object.keys(nodeEl).forEach(function(k){nodeEl[k].classList.remove('hl')});edgeEl.forEach(function(o){o.el.classList.remove('hl')});clearLazy();
   Object.keys(peeked).forEach(function(k){var g=nodeEl[k];if(g&&g._s.fog&&!revealAll&&g._full)setDust(g._s,g)});peeked={};svg.classList.remove('has-sel');opt.onDeselect&&opt.onDeselect();apply()},
  setColorMode:function(m){colorMode=m;Object.keys(nodeEl).forEach(function(k){var pl=nodeEl[k].querySelector('.planet');if(pl)pl.innerHTML=SG.planetSVG(SG.by[k],m)})},
  setGhost:function(b){showGhost=b;svg.classList.toggle('showghost',b)},
  selected:function(){return sel},info:info,level:function(){return level},cam:cam,
  stats:function(){var f=0,d=0,dl=0;Object.keys(denseOf).forEach(function(k){var g=nodeEl[k];if(g._full)f++;else d++;if(g._detail)dl++});return{full:f,dust:d,detail:dl,elements:svg.getElementsByTagName('*').length}},
  resize:function(){apply()},destroy:function(){cancelAnimationFrame(anim);if(offOrbit)offOrbit();if(window.SG&&SG.orbit)SG.orbit.blockers=SG.orbit.blockers.filter(function(b){return b!==blocked});svg.remove()}};
 function ensureDetailNow(id){var g=nodeEl[id];if(g&&g._full)ensureDetail(id);uprightApply()}
 svg.classList.toggle('showghost',showGhost);
 // initial view
 var b0=bounds(list);setCam(fitRect(b0[0],b0[1],b0[2],b0[3],mode==='world'?30:20));
 new ResizeObserver(function(){if(!sel&&level==='galaxy'&&mode==='world'){var b=bounds(list);setCam(fitRect(b[0],b[1],b[2],b[3],30))}}).observe(root);
 return api;
}
window.createMap2D=createMap2D;
})();
