/* Shared slow-orbit clock for Prototype C. Planets drift around their suns only while the learner is idle.
   Pauses on any pointer/keyboard/wheel/touch input, resumes after idleMs; also held by blockers (selection, open panel, list view, camera tween).
   Honors prefers-reduced-motion and the manual "Reduce motion" toggle (body.rm). Orbit periods: tier 0 = 200 s, +60 s per outer tier. */
(function(){
var now=function(){return performance.now()};
var O={phase:0,speed:0,idleMs:4000,timeScale:1,blockers:[],fns:[],lastInput:now()-2500,_last:now(),
 periodS:function(t){return 200+60*t},
 ang:function(t){return O.phase*2*Math.PI/O.periodS(t)},
 poke:function(){O.lastInput=now()},
 on:function(f){O.fns.push(f);return function(){O.fns=O.fns.filter(function(x){return x!==f})}},
 enabled:function(){return !(window.SG&&SG.reduced&&SG.reduced())&&!(document.body&&document.body.classList.contains('rm'))},
 blocked:function(){for(var i=0;i<O.blockers.length;i++){try{if(O.blockers[i]())return true}catch(e){}}return false},
 state:function(){return !O.enabled()?'reduced-motion':O.blocked()?'held (selection/panel)':(now()-O.lastInput<O.idleMs)?'paused (recent input)':O.speed>0?'orbiting':'starting'}};
// input on the speed control itself must not pause the orbit (the learner needs to see the change); input anywhere else does
O.boostUntil=0;
['pointermove','pointerdown','wheel','keydown','touchstart'].forEach(function(n){document.addEventListener(n,function(e){var t=e.target;if(t&&t.closest&&t.closest('.sg-orbitctl')){if(O.lastInput>now()-O.idleMs){O.lastInput=now()-O.idleMs}O.boostUntil=now()+1500;return}O.poke()},{passive:true,capture:true})});
function tick(t){requestAnimationFrame(tick);var dt=Math.min(.1,(t-O._last)/1000);O._last=t;if(dt<=0)return;
 if(!O.enabled()||O.blocked()){O.speed=0}
 else{var target=(now()-O.lastInput>=O.idleMs)?1:0,rate=target>O.speed?(now()<O.boostUntil?4:.7):9;O.speed+=(target-O.speed)*(1-Math.exp(-rate*dt));if(O.speed<.004)O.speed=0}
 if(O.speed>0){O.phase+=dt*O.speed*O.timeScale;for(var i=0;i<O.fns.length;i++)O.fns[i](O.phase)}}
requestAnimationFrame(tick);
// ---- orbit speed control (toolbar): slider 0x..10x + presets, live readout, persisted in localStorage ----
var STEPS=[0,.25,.5,.75,1,1.5,2,3,5,7.5,10],KEY='sg.orbitSpeed',PRESETS=[['Off',0],['Slow',.25],['Normal',1],['Fast',5]];
function fmt(v){return v===0?'Off':(v+'').replace(/^0\./,'0.')+'×'}
function nearest(v){var bi=0;STEPS.forEach(function(s,i){if(Math.abs(s-v)<Math.abs(STEPS[bi]-v))bi=i});return bi}
O.setSpeed=function(v,persist){v=Math.max(0,Math.min(10,+v||0));O.timeScale=v;if(persist!==false){try{localStorage.setItem(KEY,String(v))}catch(e){}}};
try{var sv=localStorage.getItem(KEY);if(sv!==null&&!isNaN(+sv))O.timeScale=STEPS[nearest(+sv)]}catch(e){}
O.mountControl=function(before){
 var w=document.createElement('span');w.className='sg-orbitctl';w.setAttribute('role','group');w.setAttribute('aria-label','Orbit speed');
 w.innerHTML='<label for="orbspd">Orbit</label>'+PRESETS.map(function(p){return '<button type="button" class="btn sm" data-v="'+p[1]+'" aria-pressed="false" title="'+p[0]+' ('+fmt(p[1])+')">'+p[0]+'</button>'}).join('')+
  '<input type="range" id="orbspd" min="0" max="'+(STEPS.length-1)+'" step="1" aria-describedby="orbout"><output id="orbout" for="orbspd"></output><span class="st" id="orbst" role="status"></span>';
 before.parentNode.insertBefore(w,before);
 var r=w.querySelector('input'),out=w.querySelector('output'),st=w.querySelector('#orbst');
 function sync(){var i=nearest(O.timeScale);r.value=i;var v=STEPS[i];out.textContent=fmt(v);r.setAttribute('aria-valuetext','Orbit speed '+(v===0?'off':v+' times'));
  Array.prototype.forEach.call(w.querySelectorAll('button'),function(b){b.setAttribute('aria-pressed',String(+b.dataset.v===v))})}
 r.addEventListener('input',function(){O.setSpeed(STEPS[+r.value]);sync()});
 w.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(!b)return;O.setSpeed(+b.dataset.v);sync()});
 function status(){var s=O.state(),txt=!O.enabled()?'off: reduced motion':O.timeScale===0?'':s==='orbiting'?'drifting':s.indexOf('held')===0?'held: skill open':s.indexOf('paused')===0?'paused while you work':'';st.textContent=txt;w.classList.toggle('rmon',!O.enabled())}
 sync();status();setInterval(status,400);return w};
window.SG=window.SG||{};SG.orbit=O;
})();
