/* Direction A prototype helpers. No backend. Dark is the default; the only theme control is Settings > Learner > Appearance. */
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.from((r||document).querySelectorAll(s))};
function h(html){var d=document.createElement('div');d.innerHTML=html.trim();return d.firstChild}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
var LS={get:function(k,d){try{var v=localStorage.getItem('ka.'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},set:function(k,v){try{localStorage.setItem('ka.'+k,JSON.stringify(v))}catch(e){}}};
/* appearance and access settings, applied on every page */
function applyPrefs(){
 var t=LS.get('theme','dark'),light=t==='light'||(t==='mac'&&window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches);
 document.body.classList.toggle('light',light);
 document.documentElement.style.fontSize=(LS.get('text',100)/100*16)+'px';
 document.body.classList.toggle('hc',!!LS.get('hc',false));
 document.body.classList.toggle('rm',!!LS.get('rm',false));
 document.body.classList.toggle('easyfont',!!LS.get('easy',false));
}
document.addEventListener('DOMContentLoaded',applyPrefs);
function toast(m){var t=h('<div class="toast" role="status">'+m+'</div>');document.body.appendChild(t);setTimeout(function(){t.remove()},2200)}
function closeLayers(){$$('.modal-bg').forEach(function(m){m.remove()});$$('.menu').forEach(function(m){m.remove()})}
/* modal(title, bodyHtml, [{t,pri,danger,fn}]) ; fn returning false keeps the sheet open */
function modal(title,body,acts){
 closeLayers();
 var bg=h('<div class="modal-bg" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="modal"><div class="row"><h2 class="sp">'+title+'</h2><button class="btn ghost" aria-label="Close">✕</button></div><div class="mb">'+body+'</div><div class="err" data-err></div><div class="row" style="justify-content:flex-end;margin-top:10px" data-acts></div></div></div>');
 $('.btn.ghost',bg).onclick=function(){bg.remove()};
 (acts||[{t:'Close'}]).forEach(function(a){var b=h('<button class="btn'+(a.pri?' pri':'')+(a.danger?' danger':'')+'">'+a.t+'</button>');b.onclick=function(){if(a.fn&&a.fn(bg)===false)return;bg.remove()};$('[data-acts]',bg).appendChild(b)});
 document.body.appendChild(bg);var f=$('input,select,.btn.pri',bg);f&&f.focus();return bg}
function popMenu(anchor,items){
 var open=$('.menu');closeLayers();if(open&&open.dataset.for===anchor.id)return;
 var r=anchor.getBoundingClientRect();var m=h('<div class="menu" data-for="'+(anchor.id||'')+'"></div>');
 items.forEach(function(i){var e=i.href?h('<a href="'+i.href+'">'+i.t+'</a>'):h('<button>'+i.t+'</button>');if(i.fn)e.onclick=function(){m.remove();i.fn()};m.appendChild(e)});
 m.style.top=(r.bottom+window.scrollY+6)+'px';m.style.left=Math.max(8,r.right+window.scrollX-210)+'px';document.body.appendChild(m);
 setTimeout(function(){document.addEventListener('click',function f(ev){if(!m.contains(ev.target)){m.remove();document.removeEventListener('click',f)}})},0)}
/* keyboard: Command-comma opens Settings, Command-K searches */
document.addEventListener('keydown',function(e){if((e.metaKey||e.ctrlKey)&&e.key===','){e.preventDefault();location.href='settings.html'}
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();var s=$('#gsearch');s&&s.focus()}
 if(e.key==='Escape')closeLayers()});

/* ---------- side bar: 10 items in 3 groups, Settings at the bottom ---------- */
var SIDE=[['Learn',[['today','Today','🏠','today.html'],['lesson','Lesson','📖','lesson.html'],['practice','Practice','🎯','section.html?s=practice'],['map','Knowledge map','🗺','section.html?s=map']]],
 ['School',[['school','School','🏫','section.html?s=school'],['plan','Study plan','🗓','section.html?s=plan'],['prep','Test prep','📝','section.html?s=prep'],['ready','Readiness','🚀','section.html?s=ready']]],
 ['Progress',[['growth','Growth','📈','section.html?s=growth'],['portfolio','Portfolio','🗂','section.html?s=portfolio']]]];
function learnerName(){return LS.get('nick','Dustin')}
function shell(active,title,inner){
 var side='<aside class="sb" aria-label="Side bar"><div class="brand">◆ KelyraAdvance</div><nav>'+SIDE.map(function(g){return '<div class="grp">'+g[0]+'</div>'+g[1].map(function(i){return '<a class="nv'+(i[0]===active?' on':'')+'" data-side href="'+i[3]+'"'+(i[0]===active?' aria-current="page"':'')+'><span>'+i[2]+'</span><span>'+i[1]+'</span></a>'}).join('')}).join('')+'</nav><div class="sbsp"></div><a class="nv" data-bottom href="settings.html"><span>⚙️</span><span>Settings</span></a></aside>';
 var top='<div class="top"><h2 class="sp">'+title+'</h2><span class="status" id="status">Saved on this Mac</span><input type="text" id="gsearch" placeholder="Search ⌘K" aria-label="Search"><button class="btn ghost" id="helpbtn">Help</button><button class="btn ghost" id="lmenu">'+esc(learnerName())+' ▾</button></div>';
 document.body.innerHTML='<div class="app">'+side+'<div class="wrap">'+top+'<main class="pg" id="main">'+inner+'</main></div></div>';
 applyPrefs();
 $$('a.nv.on').forEach(function(l){l.onclick=function(e){e.preventDefault();toast('You are already on '+l.lastChild.textContent+'.')}});
 $('#helpbtn').onclick=function(){modal('Help','<p>Need a hand? Pick one.</p><ul class="rl"><li>Start a lesson</li><li>Turn on the AI tutor</li><li>Make text bigger: Settings, Learner</li><li>Back up the family\'s records: Settings, Backup and devices</li></ul>',[{t:'Open Settings',pri:1,fn:function(){location.href='settings.html'}},{t:'Close'}])};
 $('#status').onclick=function(){toast('Everything is saved. A banner appears only if something needs your attention.')};
 $('#status').style.cursor='pointer';$('#status').setAttribute('role','button');$('#status').tabIndex=0;
 $('#lmenu').onclick=function(){popMenu(this,[{t:'Switch learner',fn:switchLearner},{t:'Settings',href:'settings.html'},{t:'Family inbox',fn:familyInbox},{t:'Help',fn:function(){$('#helpbtn').click()}}])};
 $('#lmenu').id='lmenu';
 var gs=$('#gsearch');gs.oninput=function(){var q=gs.value.trim().toLowerCase();closeLayers();if(!q)return;
  var all=[].concat.apply([],SIDE.map(function(g){return g[1]})).concat([['settings','Settings','⚙️','settings.html']]);
  var hits=all.filter(function(i){return i[1].toLowerCase().indexOf(q)>=0});var r=gs.getBoundingClientRect();
  var m=h('<div class="menu" data-for="gsearch"></div>');(hits.length?hits:[['','No match. Try a lesson name or a setting.','','']]).forEach(function(i){m.appendChild(i[3]?h('<a href="'+i[3]+'">'+i[2]+' '+i[1]+'</a>'):h('<span class="mut sm" style="padding:8px;display:block">'+i[1]+'</span>'))});
  m.style.top=(r.bottom+window.scrollY+6)+'px';m.style.left=r.left+'px';document.body.appendChild(m)};
}
function switchLearner(){modal('Switch learner','<p class="mut">Choose who is learning.</p>',[{t:'Dustin',fn:function(){LS.set('nick','Dustin');location.reload()}},{t:'William',fn:function(){LS.set('nick','William');location.reload()}},{t:'Cancel'}])}
function familyInbox(){modal('Family inbox','<ul class="rl"><li><span class="chip">Today</span> Dustin finished Lesson 6.1.</li><li><span class="chip">Mon</span> A weekly summary is ready.</li></ul><p class="mut sm">Safety alerts also appear here. They never include lesson text.</p>',[{t:'Open Family and privacy',pri:1,fn:function(){LS.set('pane','family');location.href='settings.html#family'}},{t:'Close'}])}
function aiFirstUse(then){
 modal('Turn on the AI tutor?','<p>A parent or guardian decides this. If it is on, your question and the tutor\'s reply go to the AI company named in Settings, AI tutor. Lessons and practice work without it.</p>',
 [{t:'Ask a parent or guardian',pri:1,fn:function(){toast('Asked. A parent or guardian can turn it on in Settings, AI tutor.')}},{t:'Not now'}])}
