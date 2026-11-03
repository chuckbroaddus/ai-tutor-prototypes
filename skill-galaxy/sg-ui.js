/* Shared page chrome for the Skill Galaxy prototypes (toolbar, breadcrumb, legend, attributes, drawer, list view). EXAMPLE DATA. */
(function(){
function h(html){var d=document.createElement('div');d.innerHTML=html.trim();return d.firstChild}
function build(cfg){
 var app=h('<div class="sg-app"></div>');document.body.appendChild(app);
 var top=h('<header class="sg-top"><h1>'+cfg.title+'</h1><span class="sg-ex" title="All learner values on this page are invented for design review">Example data</span><span class="sg-subjchips" id="presets" role="group" aria-label="Jump to"></span><span class="sp"></span>'+
  '<label class="tg">Color by <select id="cmode" aria-label="Color planets by"><option value="tier">Mastery tier (spec palette)</option><option value="subject">Subject hue</option></select></label>'+
  '<label class="tg"><input type="checkbox" id="ghost"> Show locked links</label><label class="tg"><input type="checkbox" id="rm"> Reduce motion</label>'+
  '<button class="btn" id="listbtn" aria-pressed="false">☰ List view</button><a class="btn ghost" href="index.html">All prototypes</a></header>');
 var crumb=h('<nav class="sg-crumb" aria-label="Where you are"></nav>');
 var stage=h('<main class="sg-stage" id="stage"></main>');
 app.appendChild(top);app.appendChild(crumb);app.appendChild(stage);
 var attr=h('<aside class="sg-attr" aria-label="Attributes" hidden></aside>'),leg=h('<aside class="sg-leg" aria-label="Legend"></aside>'),zoom=h('<div class="sg-zoom"><button class="btn" id="zin" aria-label="Zoom in">+</button><button class="btn" id="zout" aria-label="Zoom out">−</button><button class="btn" id="zfit" aria-label="Fit to view" title="Fit (0)" style="font-size:12px">Fit</button></div>'),
  hint=h('<div class="sg-hint">'+(cfg.hint||'Scroll to zoom · drag to pan · click a planet')+'</div>'),draw=h('<aside class="sg-draw" aria-hidden="true" aria-label="Skill detail"></aside>'),list=h('<section class="sg-list" aria-label="List view"></section>');
 [attr,leg,zoom,hint,draw,list].forEach(function(e){stage.appendChild(e)});
 SG.legend(leg);var lb=h('<button class="btn ghost sm" style="position:absolute;right:6px;top:6px;padding:0 6px">–</button>');leg.appendChild(lb);if(window.innerWidth<1500){leg.classList.add('min');lb.textContent='Legend'}
 lb.onclick=function(){leg.classList.toggle('min');lb.textContent=leg.classList.contains('min')?'Legend':'–'};
 var R={app:app,top:top,crumb:crumb,stage:stage,attr:attr,leg:leg,zoom:zoom,hint:hint,draw:draw,list:list,presets:top.querySelector('#presets'),
  colorMode:function(){return top.querySelector('#cmode').value},ghost:function(){return top.querySelector('#ghost').checked},
  setCrumb:function(parts){crumb.innerHTML='';parts.forEach(function(p,i){if(i)crumb.appendChild(document.createTextNode(' › '));if(p.fn){var b=document.createElement('button');b.textContent=p.t;b.onclick=p.fn;crumb.appendChild(b)}else{var s=document.createElement('b');s.textContent=p.t;s.setAttribute('aria-current','true');crumb.appendChild(s)}})},
  showAttrs:function(id){var u=id&&SG.sub[id];if(!u||!u.attrs){attr.hidden=true;return}attr.hidden=false;attr.innerHTML='<b>'+u.name+' attributes</b><div class="mut sm" style="margin-bottom:4px">Rise only with verified mastery</div>'+u.attrs.map(function(a){return '<div class="ar"><span>'+a[0]+'</span><div class="bar"><i style="width:'+a[1]+'%"></i></div><span class="mut">'+a[1]+'</span></div>'}).join('')+(u.note?'<div class="mut sm" style="margin-top:6px;max-width:210px">'+u.note+'</div>':'')},
  shift:function(on){attr.classList.toggle('shift',on);zoom.classList.toggle('shift',on)}};
 top.querySelector('#rm').checked=SG.reduced();if(SG.reduced())document.body.classList.add('rm');
 top.querySelector('#rm').onchange=function(e){document.body.classList.toggle('rm',e.target.checked)};
 return R;
}
window.SGUI={build:build};
})();
