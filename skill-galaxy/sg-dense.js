/* Dense-system layout (domain sectors by angle, bands by radius) + mastery-layer encoding. Extends SG after sg-core.js. EXAMPLE DATA. */
(function(){
var TH=SG.TH,by=SG.by,sub=SG.sub;
var DIMS=[
 {k:'u',n:'Explain it',c:'#5eead4',a0:-78,a1:18,dash:'',how:'Items that ask you to explain why, show the idea a second way, connect it to another idea, or find the mistake in a worked example. Graded by rubric; counts for more when the grader is confident.'},
 {k:'f',n:'Do it fast',c:'#fcd34d',a0:42,a1:138,dash:'0.1 4.6',how:'Correct answers that are also quick and effortless, compared with your own earlier pace on the same kind of item (for example counting on fingers versus recalling the fact). Only shown for skills where speed matters.'},
 {k:'t',n:'Use it anywhere',c:'#f0abfc',a0:162,a1:258,dash:'6 3.4',how:'Correct answers on new-looking problems and in different contexts, spread over several sessions and weeks. Grows slowly; it is the “seasoned” part of mastery.'}];
function hs(str){var h=2166136261;for(var i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967296}
function rg(id,salt,lo,hi){return lo+(hi-lo)*hs(id+salt)}
function knowOf(s){return s.p!=null?s.p:(s.fresh?Math.min(1,s.m/s.fresh):s.m)}
function dimsOf(s){ // invented per-skill layer values; the full-math learner file supplies its own
 if(s.dim!==undefined&&s.dim!==null)return s.dim;if(s.dim===null&&s.m<TH.started)return null;
 if(s.m<TH.started){s.dim=null;return null}
 var id=s.id,m=s.m,u,t;
 if(m>=.85){u=rg(id,'u',.72,.97);t=rg(id,'t',.62,.93)}else if(m>=.55){u=rg(id,'u',.45,.8);t=rg(id,'t',.2,.58)}else if(m>=.3){u=rg(id,'u',.2,.5);t=rg(id,'t',.02,.28)}else{u=rg(id,'u',.03,.2);t=rg(id,'t',0,.08)}
 var f=null;if(s.subj==='span')f=m>=.85?rg(id,'f',.6,.95):m>=.55?rg(id,'f',.35,.75):rg(id,'f',.1,.45);
 s.dim={u:u,f:f,t:t,span:Math.round((s.days||0)+rg(id,'sp',20,400))};return s.dim}
function seasoned(s){var d=dimsOf(s);return !!d&&s.m>=.85&&d.u>=.8&&d.t>=.75&&d.span>=180}
function arc(r,a0,a1){a0*=Math.PI/180;a1*=Math.PI/180;var x0=r*Math.cos(a0),y0=r*Math.sin(a0),x1=r*Math.cos(a1),y1=r*Math.sin(a1);return 'M'+x0.toFixed(2)+','+y0.toFixed(2)+'A'+r+','+r+' 0 '+((a1-a0)>Math.PI?1:0)+' 1 '+x1.toFixed(2)+','+y1.toFixed(2)}
function dimSVG(s){var d=dimsOf(s);if(!d)return '';var dn=sub[s.subj].dense,r=SG.radius(s),tr=r+5,rd=tr+(dn?4.5:9),w=dn?2.1:2.8,o='<g class="dimsg">';
 DIMS.forEach(function(D){var v=d[D.k];if(v==null)return;
  o+='<path d="'+arc(rd,D.a0,D.a1)+'" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="'+w+'" stroke-linecap="round"/>';
  if(v>.02)o+='<path d="'+arc(rd,D.a0,D.a0+(D.a1-D.a0)*Math.min(1,v))+'" fill="none" stroke="'+D.c+'" stroke-width="'+(w+.4)+'" stroke-linecap="'+(D.dash&&D.dash.charAt(0)==='0'?'round':'butt')+'"'+(D.dash?' stroke-dasharray="'+D.dash+'"':'')+'/>'});
 if(seasoned(s))o+='<circle class="halo" r="'+(rd+(dn?3.5:6))+'" fill="#fde68a" fill-opacity=".07" stroke="#fde68a" stroke-opacity=".6" stroke-width="1.1"/>';
 return o+'</g>'}
function bar(v,c,dash){return '<div class="ml-bar"><i style="width:'+Math.round(v*100)+'%;background:'+c+'"></i></div>'}
function masteryHTML(s){
 var d=dimsOf(s),h='<h3>Mastery layers <span class="mut sm">(design sketch, invented values)</span></h3>';
 if(!d){return h+'<p class="mut sm">Layers appear once you have started this skill.</p>'}
 var know=knowOf(s),R=s.fresh==null?1:s.fresh,rows=[['Know it',know,'#58a6ff','Accuracy on practice, weighted by how many hints you needed (LM-010/011). This is the ring around the planet.'],
  ['Explain it',d.u,DIMS[0].c,DIMS[0].how],['Do it fast',d.f,DIMS[1].c,DIMS[1].how],['Use it anywhere',d.t,DIMS[2].c,DIMS[2].how],['Stays fresh',R,'#c9d1d9','How much you would likely remember today, from the time since your last evidence (forgetting curve, LM-012). It dims the planet; nothing you earned is removed.']];
 h+='<div class="ml">'+rows.map(function(r){return '<div class="ml-r"><span class="ml-n"><i style="background:'+r[2]+'"></i>'+r[0]+'</span>'+(r[1]==null?'<span class="mut sm ml-na">not needed for this skill</span>':bar(r[1],r[2])+'<b>'+SG.pct(r[1])+'%</b>')+'<button class="ml-i" type="button" aria-label="How we measure '+r[0]+'" title="'+r[3].replace(/"/g,'&quot;')+'">i</button></div>'}).join('')+'</div>';
 h+='<p class="mut sm">Mastery % at the top = Know it × Stays fresh. '+(seasoned(s)?'<b style="color:#fde68a">Seasoned</b>: understood and used in varied situations over 6+ months.':'Seasoned (gold halo) needs Mastered, Explain ≥ 80%, Use anywhere ≥ 75% and 6+ months of evidence.')+'</p>';
 h+='<details class="ml-how"><summary>How each layer is measured</summary>'+rows.map(function(r){return '<p><b>'+r[0]+'.</b> '+r[3]+'</p>'}).join('')+'</details>';
 return h}
function metaHTML(s){var u=sub[s.subj];if(!u.dense)return '';var D=(u.domains||[]).filter(function(x){return x.id===s.domain})[0],St=D&&D.strands.filter(function(x){return x.id===s.strand})[0],B=u.bands[s.tier];
 return '<h3>Where it sits</h3><p class="mut sm">'+(D?D.name:'')+(St?' › '+St.name:'')+'<br>'+B.name+' · typical age '+B.typicalAge+'</p>'+(s.refs&&s.refs.length?'<p class="mut sm">Aligned to: '+s.refs.join('; ')+'</p>':'')}
function legendLayers(){var s={id:'lg',m:.93,p:.97,fresh:.96,state:'mastered',review:false,subj:'chem',early:false,dim:{u:.86,f:.72,t:.8,span:300}};
 var s2={id:'lg2',m:.7,p:.9,fresh:.77,state:'solid',review:false,subj:'chem',early:false,dim:{u:.6,f:null,t:.3,span:40}};
 function sw(x){return '<svg width="52" height="52" viewBox="-30 -30 60 60">'+SG.planetSVG(x,'tier')+dimSVG(x)+'</svg>'}
 return '<div class="sg-lg3"><b>Mastery layers</b> <span class="mut sm">(close zoom)</span><div class="sg-lgl">'+sw(s)+'<span><span class="k" style="--c:#5eead4">▬</span> Explain it (solid arc)<br><span class="k" style="--c:#fcd34d">•••</span> Do it fast (dotted arc)<br><span class="k" style="--c:#f0abfc">▬ ▬</span> Use it anywhere (dashed arc)</span></div>'+
 '<div class="mut sm">Gold halo = seasoned. Brightness = how fresh. Arcs are left out where a layer does not apply.</div></div>'}
// ---- dense layout: domain wedges by angle (width = peak occupancy), bands by radius, zig-zag rows where a band is crowded ----
function layoutDense(u){
 var L=u.skills,nb=u.tiers.length,order=u.hints.domainOrder,ARC=40,ONE=50,ROW=32,bandGap=40,zoneGap=50,R0=250;
 var cell={},peak={};order.forEach(function(d){cell[d]={};peak[d]=0});
 var sIdx={};u.domains.forEach(function(dm){dm.strands.forEach(function(st,i){sIdx[st.id]=i})});
 L.forEach(function(s,i){var c=cell[s.domain][s.tier]=cell[s.domain][s.tier]||[];c.push({s:s,i:i})});
 order.forEach(function(d){for(var b=0;b<nb;b++){var c=cell[d][b];if(c){c.sort(function(x,y){return x.s.strand===y.s.strand?x.i-y.i:sIdx[x.s.strand]-sIdx[y.s.strand]});peak[d]=Math.max(peak[d],c.length)}}});
 var seam=14*Math.PI/180,gD=2.6*Math.PI/180,ws=order.map(function(d){return peak[d]+1.5}),W=ws.reduce(function(a,b){return a+b},0),avail=2*Math.PI-seam-gD*(order.length-1),a=-Math.PI/2+seam/2;
 u._D={};u._S={};var wedge={};
 order.forEach(function(d,i){var dm=u.domains.filter(function(x){return x.id===d})[0],w=avail*ws[i]/W;wedge[d]={a0:a,a1:a+w,mid:a+w/2};a+=w+gD;
  u._D[d]={id:d,name:dm.name,short:dm.short||dm.name,hue:dm.hue,a0:wedge[d].a0,a1:wedge[d].a1,mid:wedge[d].mid,count:L.filter(function(s){return s.domain===d}).length}});
 var R=[],T=[],prevZone=null,prevEnd=0;
 for(var b=0;b<nb;b++){var z=u.bands[b].zone,base=b?prevEnd+bandGap+(z!==prevZone?zoneGap:0):R0,rows=1,r=base;
  // smallest radius at which every domain's cell fits (one row needs ONE px per node, a zig-zag of rows needs ARC)
  var need=0;order.forEach(function(d){var c=cell[d][b];if(c){var w=wedge[d].a1-wedge[d].a0;need=Math.max(need,c.length*ARC/w)}});
  r=Math.max(base,need);
  order.forEach(function(d){var c=cell[d][b];if(c){var w=wedge[d].a1-wedge[d].a0;if(c.length*ONE>w*r)rows=Math.max(rows,2)}});
  R[b]=r;T[b]=rows>1?ROW:0;prevEnd=r+T[b];prevZone=z}
 var pos={};
 order.forEach(function(d){for(var b=0;b<nb;b++){var c=cell[d][b];if(!c)continue;var n=c.length,w=wedge[d].a1-wedge[d].a0,rows=T[b]?2:1,step=Math.min(w/n,(rows===1?70:44)/R[b]);
  c.forEach(function(it,j){var ang=wedge[d].mid+(j-(n-1)/2)*step,rr=R[b]+(rows>1&&j%2?T[b]:0);pos[it.s.id]={a:ang,r:rr,x:rr*Math.cos(ang),y:rr*Math.sin(ang)}})}});
 u._R=R;u._T=T;u._lp=pos;u.tierMax=nb-1;u._starR=R0-125;return pos}
Object.assign(SG,{DIMS:DIMS,dimsOf:dimsOf,knowOf:knowOf,seasoned:seasoned,dimSVG:dimSVG,masteryHTML:masteryHTML,metaHTML:metaHTML,legendLayers:legendLayers,layoutDense:layoutDense});
})();
