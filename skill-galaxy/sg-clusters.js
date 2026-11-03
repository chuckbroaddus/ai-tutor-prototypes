/* Star-cluster model for prototype D. Subject = cluster, domain/layer = star, skill = planet.
   Stars have their own prerequisite graph. A star unlocks when each prerequisite star has >= UNLOCK of its skills Solid (p_known >= .55).
   A star counts as mastered (collapses into the meta-cluster) when >= DONE of its skills are at Mastered-level knowledge (>= .85).
   Math stars come from data/math-stars.js (built from data/math-skills.json); other subjects use one star per orbit tier. EXAMPLE DATA. */
(function(){
var TH=SG.TH,DX=210,DY=165,UNLOCK=.60,DONE=.90;
function kn(s){return s.p!=null?s.p:s.m}
function lerp(a,b,t){return a+(b-a)*t}
var CL={DX:DX,DY:DY,UNLOCK:UNLOCK,DONE:DONE,clusters:[],by:{},star:{},ofSkill:{},tmpShowLocked:false};
var ANCH={math:[0,0],chem:[1950,-330],span:[-1950,230],phys:[-120,1250],bio:[1900,1050],eng:[-1950,-950],hist:[250,-1250]};
var WIG=[0,.6,-.45,.5,-.25];
function build(){
 CL.clusters=[];CL.by={};CL.star={};CL.ofSkill={};
 SG.SUBJ.forEach(function(u){
  var c={id:u.id,name:u.name,color:u.color,u:u,stars:[],expanded:false,expT:0,meta:null,anchor:ANCH[u.id]||[0,0],origin:{x:0,y:0}};
  var defs;
  if(u.id==='math'&&window.SG_MATH_STARS){defs=SG_MATH_STARS.stars.map(function(s){return{sid:s.id,name:s.name,short:s.short,zone:SG_MATH.levelModel.zones.filter(function(z){return z.id===s.zone})[0].name.split(':')[0],x:s.x,y:s.y,pre:s.prereqs,skills:s.skills,hue:s.hue,blurb:s.blurb}})}
  else{defs=[];var prev=null;u.tiers.forEach(function(tn,t){var L=u.skills.filter(function(s){return s.tier===t}).map(function(s){return s.id});if(!L.length)return;
    defs.push({sid:'t'+t,name:tn,short:tn,zone:'',x:defs.length,y:WIG[defs.length%5],pre:prev?[prev]:[],skills:L,hue:u.color,blurb:u.id==='span'?'ACTFL sublevel: '+tn:'Orbit tier: '+tn});prev='t'+t})}
  defs.forEach(function(d){var st={id:u.id+':'+d.sid,sid:d.sid,cl:c,name:d.name,short:d.short,zone:d.zone,hue:d.hue,blurb:d.blurb,cx:d.x*DX,cy:d.y*DY,skills:d.skills,pre:d.pre.map(function(p){return u.id+':'+p}),dep:[],n:d.skills.length};
   c.stars.push(st);CL.star[st.id]=st;d.skills.forEach(function(k){CL.ofSkill[k]=st})});
  c.stars.forEach(function(st){st.pre.forEach(function(p){CL.star[p].dep.push(st.id)})});
  CL.clusters.push(c);CL.by[c.id]=c});
 refresh();
}
function refresh(){
 CL.clusters.forEach(function(c){
  c.stars.forEach(function(st){
   var L=st.skills.map(function(i){return SG.by[i]}),n=L.length;st.counts={mastered:0,solid:0,learning:0,started:0,available:0,locked:0};
   L.forEach(function(s){st.counts[s.state]++});
   st.solidShare=L.filter(function(s){return kn(s)>=TH.solid}).length/n;st.doneShare=L.filter(function(s){return kn(s)>=TH.mastered}).length/n;
   var dd=L.map(function(s){return s.days}).filter(function(v){return v!=null});st.lastDays=dd.length?Math.min.apply(null,dd):9999;st.startedAny=L.some(function(s){return kn(s)>=TH.started});st.review=L.filter(function(s){return s.review}).length;
   st.solidN=L.filter(function(s){return kn(s)>=TH.solid}).length;
   st.need=st.pre.map(function(p){var P=CL.star[p];return{id:p,star:P,have:P.solidShare,need:UNLOCK,ok:P.solidShare>=UNLOCK}});
   st.unlocked=st.need.every(function(x){return x.ok});
   st.mastered=st.unlocked&&st.doneShare>=DONE;
   st.kind=!st.unlocked?'locked':st.mastered?'mastered':st.startedAny?'active':'new';
  });
  var M=c.stars.filter(function(s){return s.mastered});
  c.mastered=M;c.frontier=c.stars.filter(function(s){return s.unlocked&&!s.mastered});c.locked=c.stars.filter(function(s){return !s.unlocked});
  c.skillsN=c.stars.reduce(function(a,s){return a+s.n},0);c.solidN=c.stars.reduce(function(a,s){return a+s.solidN},0);
  c.metaMembers=M;var act=c.stars.filter(function(s){return s.kind==='active'}).sort(function(a,b){return a.lastDays-b.lastDays});c.primary=act.length?act[0]:null;c.stars.forEach(function(s){s.primary=(s===c.primary)});
  if(M.length){var maxX=Math.max.apply(null,M.map(function(s){return s.cx})),ay=M.reduce(function(a,s){return a+s.cy},0)/M.length;
   var nm=M.length===1?M[0].name+': mastered':'Mastered: '+M.slice().sort(function(a,b){return a.cx-b.cx||a.cy-b.cy})[0].short+' → '+M.slice().sort(function(a,b){return b.cx-a.cx||b.cy-a.cy})[0].short;
   c.meta={cx:maxX-.62*DX,cy:ay*.5,name:nm,n:M.length,skills:M.reduce(function(a,s){return a+s.n},0)}}else c.meta=null;
  // origin so that the collapsed footprint sits at the cluster's galaxy anchor
  var pts=[];if(c.meta)pts.push([c.meta.cx,c.meta.cy]);c.frontier.forEach(function(s){pts.push([s.cx,s.cy])});if(!pts.length)c.stars.forEach(function(s){pts.push([s.cx,s.cy])});
  var x0=Math.min.apply(null,pts.map(function(p){return p[0]})),x1=Math.max.apply(null,pts.map(function(p){return p[0]})),y0=Math.min.apply(null,pts.map(function(p){return p[1]})),y1=Math.max.apply(null,pts.map(function(p){return p[1]}));
  c.origin={x:c.anchor[0]-(x0+x1)/2,y:c.anchor[1]-(y0+y1)/2};
  c.stars.forEach(function(s){s.wx=c.origin.x+s.cx;s.wy=c.origin.y+s.cy});if(c.meta){c.meta.wx=c.origin.x+c.meta.cx;c.meta.wy=c.origin.y+c.meta.cy}
  // planet orbits for each star (rings by internal prerequisite depth)
  c.stars.forEach(function(st){var set={};st.skills.forEach(function(i){set[i]=1});var dep={};function d(i){if(dep[i]!=null)return dep[i];dep[i]=0;var m=-1;SG.by[i].pre.forEach(function(p){if(set[p])m=Math.max(m,d(p))});return dep[i]=m+1}
   var L=st.skills.slice().sort(function(a,b){return d(a)-d(b)||(SG.by[a].strand||'').localeCompare(SG.by[b].strand||'')||SG.by[a].name.localeCompare(SG.by[b].name)}),N=L.length,m=N<=9?1:N<=28?2:3,R0=N<=9?112:128,rs=[];for(var i=0;i<m;i++)rs.push(R0+i*88);
   var wsum=rs.reduce(function(a,b){return a+b},0),cnt=rs.map(function(r){return Math.round(N*r/wsum)});var diff=N-cnt.reduce(function(a,b){return a+b},0);cnt[m-1]+=diff;
   st.ring={};st.rings=rs;var p=0;rs.forEach(function(r,ri){for(var j=0;j<cnt[ri];j++){st.ring[L[p++]]={ri:ri,r:r,a:-Math.PI/2+(j+(ri%2?.5:0))/cnt[ri]*2*Math.PI}}});st.R=rs[m-1];st.depth=dep});
 });
}
CL.build=build;CL.refresh=refresh;CL.disp=function(st){var c=st.cl;if(!st.mastered||!c.meta)return{x:st.wx,y:st.wy};var t=c.expT;return{x:lerp(c.meta.wx,st.wx,t),y:lerp(c.meta.wy,st.wy,t)}};
CL.skillCount=function(){return SG.SK.length};
SG.CL=CL;build();
})();
