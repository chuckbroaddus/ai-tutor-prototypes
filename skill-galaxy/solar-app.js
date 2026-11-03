import * as THREE from 'three';
const SOL=SG.SOL,TH=SG.TH,DIMS=SG.DIMS;
const UI=SGUI.build({title:'Skill Galaxy · E · solar systems',hint:'Galaxy: stars and their planets · click a star to fly in · Esc or scroll out goes back'});
const stage=UI.stage;
['#cmode','#ghost'].forEach(q=>{const l=UI.top.querySelector(q).closest('label');l&&l.remove()});
const RM=()=>SG.reduced()||document.body.classList.contains('rm');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t,ss=(x,a,b)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const FOV=40,EL=58*Math.PI/180,TANH=Math.tan(FOV*Math.PI/360),SINE=Math.sin(EL),COSE=Math.cos(EL);
const SVGNS='http://www.w3.org/2000/svg';
function E(tag,at,par){const e=document.createElementNS(SVGNS,tag);if(at)for(const k in at)e.setAttribute(k,at[k]);if(par)par.appendChild(e);return e}
const pct=v=>Math.round(v*100);

/* ---------- three.js ---------- */
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x000000,0);
const cv=renderer.domElement;cv.className='three';cv.setAttribute('aria-hidden','true');stage.insertBefore(cv,stage.firstChild);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(FOV,1,2,80000);
scene.add(new THREE.AmbientLight(0x9aa8c0,1.1));const dl=new THREE.DirectionalLight(0xffffff,1.6);dl.position.set(-.4,1,.6);scene.add(dl);
{const n=2200,p=new Float32Array(n*3);for(let i=0;i<n;i++){const r=30000,a=Math.random()*6.283,b=Math.acos(2*Math.random()-1);p[i*3]=r*Math.sin(b)*Math.cos(a);p[i*3+1]=r*Math.cos(b);p[i*3+2]=r*Math.sin(b)*Math.sin(a)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));const pts=new THREE.Points(g,new THREE.PointsMaterial({color:0xaab8d0,size:1.3,sizeAttenuation:false,transparent:true,opacity:.5,depthWrite:false}));pts.frustumCulled=false;scene.add(pts)}
function ctex(fn,S=128){const c=document.createElement('canvas');c.width=c.height=S;fn(c.getContext('2d'),S);return new THREE.CanvasTexture(c)}
const GLOW=ctex((x,S)=>{const g=x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.2,'rgba(255,255,255,.5)');g.addColorStop(.5,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,S,S)});

const NOISE=`
float h31(vec3 p){p=fract(p*0.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}`;
const PVERT=`varying vec3 vP;varying vec3 vNw;varying vec3 vWp;varying vec3 vNv;
void main(){vP=normalize(position);vNw=normalize(mat3(modelMatrix)*normal);vNv=normalize(normalMatrix*normal);vec4 w=modelMatrix*vec4(position,1.);vWp=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
/* r22 planet look: lit by the parent star's world position (uSun), soft terminator + dusk band, dark but readable night side. uM = mastery (mean p_known): ~0 barren grey-brown cratered rock -> faint atmosphere rim -> seas with a specular glint on the day side -> green lush land -> near mastery: clouds and warm city-light clusters on the night side only. */
const PFRAG=NOISE+`
uniform float uM,uSeed,uAlpha,uTime;uniform vec3 uHue,uSun,uRef;uniform vec4 uOcc[8];uniform float uOccN;
varying vec3 vP;varying vec3 vNw;varying vec3 vWp;varying vec3 vNv;
void main(){
 vec3 p=vP;float sd=uSeed*13.7,m=uM;
 float e=fbm(p*2.3+sd);
 float cra=0.,rim=0.;
 for(int k=0;k<2;k++){float sc=k==0?4.2:9.5;vec3 q=p*sc+sd+float(k)*5.;vec3 i=floor(q);vec3 c=vec3(h31(i),h31(i+7.3),h31(i+3.1));vec3 f=fract(q)-.5-.34*(c-.5);
  float r=.12+.12*h31(i+1.7),d=length(f)/r,on=step(.38,h31(i+9.1));
  cra=max(cra,(1.-smoothstep(.0,1.,d))*on);rim=max(rim,smoothstep(.72,1.,d)*(1.-smoothstep(1.,1.28,d))*on);}
 vec3 rock=mix(vec3(.17,.155,.14),vec3(.47,.41,.35),e)*(.74+.5*vn(p*19.));
 rock*=1.-.5*cra;rock+=.1*rim;
 float seaK=smoothstep(.22,.7,m),veg=smoothstep(.42,.9,m),lat=abs(p.y);
 float sea=mix(-.05,.56,seaK);
 bool wet=e<sea&&m>.2;
 float tint=vn(p*6.+sd)*.5+vn(p*13.+sd)*.5;
 vec3 grn=mix(vec3(.09,.36,.10),uHue*.45+vec3(.07,.24,.06),.3)*(.75+.5*tint);
 vec3 dry=mix(rock,rock*vec3(1.12,1.0,.8),smoothstep(.2,.5,m));
 float lush=veg*(1.-smoothstep(.55,1.,lat))*smoothstep(.3,.62,tint+.25*veg);
 vec3 land=mix(dry,grn,clamp(lush*1.15,0.,1.));
 land=mix(land,vec3(.93,.96,1.),smoothstep(.74,.92,lat+.25*(e-.5))*smoothstep(.35,.6,m)*.9);
 vec3 water=mix(vec3(.012,.06,.2),vec3(.05,.32,.5),smoothstep(sea-.2,sea,e));
 float cl=smoothstep(.5,.76,fbm(p*3.2+vec3(uTime*.012,0.,sd)))*smoothstep(.62,.92,m);
 vec3 col=wet?water:land;
 col=mix(col,vec3(1.),cl*.82);
 vec3 N=normalize(vNw),L=normalize(uSun-uRef),V=normalize(cameraPosition-vWp);
 float ndl=dot(N,L),dif=max(ndl,0.);
 float day=smoothstep(-.05,.3,ndl);
 /* r25 analytic sphere shadows: ray from this pixel toward the star (shared direction L) against up to 8 nearby occluder spheres (xyz world centre, w radius). The moon systems are drawn far larger than true scale, so there is no distance falloff and no star-size penumbra: each occluder casts a full-strength, occluder-sized disc (cylinder along L) with a thin soft edge; in the umbra the day term is zero, i.e. night-side level. */
 float sh=1.;
 for(int i=0;i<8;i++){if(float(i)>=uOccN)break;vec3 oc=uOcc[i].xyz-vWp;float t=dot(oc,L);if(t<=0.)continue;float r=uOcc[i].w,d=length(oc-L*t),w=max(r*.12,.35);
  sh*=smoothstep(r-w,r+w,d);}
 day*=sh;
 float amb=mix(.22,.27,smoothstep(.1,.6,m));
 vec3 c=col*(amb*vec3(.8,.9,1.2)+day*(.5+.55*dif));
 float sp=pow(max(dot(N,normalize(L+V)),0.),64.)*day*(wet?1.:0.)*(1.-cl)*smoothstep(.28,.5,m);
 c+=vec3(1.,.96,.88)*sp*.9;
 float fr=pow(1.-max(vNv.z,0.),3.),sa=smoothstep(.1,.38,m);
 vec3 atm=mix(vec3(.28,.55,1.),uHue,.3);
 c+=atm*fr*sa*(.1+1.05*smoothstep(-.25,.5,ndl))*1.1;
 float dusk=exp(-pow(ndl/.1,2.));
 c+=vec3(1.,.5,.25)*dusk*(.04+.12*sa*(.4+fr))*smoothstep(0.,.3,m+.15);
 float night=1.-smoothstep(-.03,.14,ndl),cm=smoothstep(.76,.95,m);
 if(cm>0.&&night>0.){float cluster=smoothstep(.55,.72,fbm(p*5.+sd+9.));float dots=step(.7,vn(p*52.+sd))*(.55+.45*vn(p*150.));float on=(wet?0.:1.)*cluster*dots*night*cm*(1.-cl*.75);c+=vec3(1.,.74,.38)*on*1.7;}
 gl_FragColor=vec4(c,uAlpha);}`;
/* Stars: boiling photosphere (domain-warped fbm granulation + fine ripples + drifting sunspots + limb darkening), all in one fragment shader.
   Corona + flares: a camera-facing billboard (additive) with noisy coronal rays and three prominence slots; each slot erupts every ~6-10 s (arch loop or plume), grows, then fades. Reduced motion: uTime=0 and uFlare=0 (static, no flares). */
const SFRAG=NOISE+`
uniform vec3 uCol;uniform float uAlpha,uBright,uTime,uSeed;varying vec3 vP;varying vec3 vNv;
void main(){vec3 p=vP;float t=uTime;vec3 q=p*3.2+uSeed*7.;
 vec3 w=vec3(fbm(q+vec3(0.,0.,t*.18)),fbm(q+vec3(5.2,1.3,t*.15)),fbm(q+vec3(2.1,7.7,t*.2)));
 float gr=fbm(p*9.+w*1.7+vec3(0.,t*.25,uSeed));
 float rip=vn(p*24.+w*2.2+vec3(t*.7,0.,uSeed));
 float spots=smoothstep(.60,.72,fbm(p*2.4+uSeed*3.+vec3(0.,0.,t*.025)));
 float mu=max(vNv.z,0.);float limb=.26+.74*pow(mu,.62);
 vec3 hot=mix(uCol,vec3(1.,.96,.82),.58),cool=uCol*.55;
 vec3 c=mix(cool,hot,smoothstep(.28,.78,gr*.82+rip*.28));
 c*=1.-.5*spots*smoothstep(.15,.6,mu);c+=(rip-.5)*.2*uCol;
 c*=limb*uBright*1.5;c+=vec3(.55)*pow(mu,6.)*.1*uBright;
 gl_FragColor=vec4(c,uAlpha);}`;
const CVERT=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
/* Corona = noisy rays. Prominences = magnetic loops: each slot picks two footpoints on the limb (random separation, side and height <= ~25% of the star radius),
   draws 3 twisted, noise-thickened plasma strands along the arc between them, with bright plasma blobs flowing footpoint -> footpoint, rises and fades in place;
   now and then a small blob lifts off the apex (stays small). Reduced motion: uFlare = 0. */
const CFRAG=NOISE+`
uniform vec3 uCol;uniform float uAlpha,uTime,uSeed,uFlare;varying vec2 vUv;
float h11(float x){return fract(sin(x*127.1+311.7)*43758.5453);}
void main(){vec2 p=(vUv-.5)*5.2;float r=length(p);if(r<.995){gl_FragColor=vec4(0.);return;}
 float ang=atan(p.y,p.x),ca=cos(ang),sa=sin(ang);
 float ray=vn(vec3(ca*2.3,sa*2.3,uTime*.12+uSeed))*.65+vn(vec3(ca*5.5,sa*5.5,uTime*.22+uSeed))*.35;
 float edge=smoothstep(.995,1.05,r);
 float cor=exp(-(r-1.)*(2.6-1.2*ray))*(.3+.95*ray);
 vec3 col=mix(uCol,vec3(1.,.9,.72),.35);
 vec3 acc=col*cor*.85;float al=cor*.8;
 vec3 pc=mix(uCol,vec3(1.,.5,.28),.6)*1.35+vec3(.12);
 if(uFlare>.01&&r<1.5){
 for(int i=0;i<3;i++){float fi=float(i),per=6.1+2.3*fi,tt=uTime+fi*3.1+uSeed*11.,n=floor(tt/per),u=fract(tt/per)/.8;
  if(u<1.){float sd=n*13.1+fi*5.3+uSeed*9.;
   if(h11(sd)>.22){
    float th1=h11(sd+1.)*6.2832,sgn=h11(sd+3.)>.5?1.:-1.,dl=(.13+.4*h11(sd+2.))*sgn;
    float H=min(.25,(.07+.5*abs(dl))*(.8+.4*h11(sd+4.)));
    float skew=.6+.9*h11(sd+5.),rise=smoothstep(0.,.32,u),fade=1.-smoothstep(.5,1.,u),liv=rise*fade;
    float da=atan(sin(ang-th1),cos(ang-th1));float s=da/dl;
    float I=0.;
    I+=1.4*exp(-pow(da/.028,2.))*exp(-pow((r-1.)/.03,2.))*liv;
    I+=1.4*exp(-pow((da-dl)/.028,2.))*exp(-pow((r-1.)/.03,2.))*liv;
    if(s>-.05&&s<1.05){
     float sc=clamp(s,0.,1.),sk=pow(sc,skew),bump=pow(max(sin(3.14159*sk),0.),.8);
     float wob=1.+.35*(vn(vec3(sc*4.,sd,uTime*.35))-.5);
     float base=H*(.35+.65*rise)*bump*wob;
     for(int k=0;k<3;k++){float fk=float(k);
      float ph=6.2832*(sc*(1.1+.45*fk)+fk*.37)+uTime*(.5+.2*fk);
      float hk=base*(1.+.22*sin(ph))+(fk-1.)*.011*(.4+bump);
      float thk=(.0075+.014*vn(vec3(sc*9.+fk*3.,sd+fk,uTime*.4)))*(.55+.8*bump);
      float dd=(r-1.)-hk;
      float band=exp(-pow(dd/thk,2.));
      float flow=smoothstep(.2,.95,vn(vec3(sc*8.-uTime*(1.2+.35*fk),fk*3.7+sd,uSeed)));
      I+=band*(.28+.95*flow)*(.55+.45*vn(vec3(sc*3.,fk,sd)))*smoothstep(0.,.1,sc)*smoothstep(1.,.9,sc)*liv;
     }
     if(h11(sd+6.)>.82){float ab=base;float rb=1.+ab+.1*u*u+.01,thc=dl*.5;float dx=(da-thc)*1.,dy=r-rb;I+=1.1*exp(-(dx*dx+dy*dy)/.0007)*smoothstep(.35,.55,u)*(1.-smoothstep(.7,1.,u));}
    }
    I*=uFlare;acc+=pc*I;al+=I*.9;}}}
 }
 gl_FragColor=vec4(acc*edge*uAlpha,al*edge*uAlpha);}`;
/* Completion rings drawn in WebGL so the depth buffer hides them behind nearer bodies. A camera-facing billboard per body; coordinates are screen px. */
const RFRAG=`
uniform float uExt,uAlpha,uR1,uR2,uSw,uShare,uSeas,uDone,uCk,uZr;uniform vec2 uCen,uRes,uTH;uniform vec4 uOc[8];uniform float uOa[8];uniform vec3 uHue,uVal;uniform vec2 uDa[3];uniform vec3 uCl[3];varying vec2 vUv;
const float TAU=6.2831853;
float arcA(vec2 p,float R,float hw,float a0,float len){float r=length(p),ph=atan(p.y,p.x),rel=mod(ph-a0,TAU),d;
 if(rel<=len)d=abs(r-R);else{vec2 e0=R*vec2(cos(a0),sin(a0)),e1=R*vec2(cos(a0+len),sin(a0+len));d=min(length(p-e0),length(p-e1));}
 return 1.-smoothstep(hw-.5,hw+.5,d);}
float segD(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;return length(pa-ba*clamp(dot(pa,ba)/dot(ba,ba),0.,1.));}
vec4 ov(vec4 d,vec3 c,float a){return vec4(c*a+d.rgb*(1.-a),a+d.a*(1.-a));}
void main(){vec2 p=(vUv-.5)*2.*uExt;p.y=-p.y;vec4 o=vec4(0.);
 o=ov(o,vec3(1.),.14*arcA(p,uR1,uSw*.5,0.,TAU));
 if(uShare>.003)o=ov(o,uHue,arcA(p,uR1,uSw*.5+.15,-1.5707963,TAU*min(uShare,1.)));
 for(int i=0;i<3;i++){if(uVal[i]>=0.){float span=uDa[i].y-uDa[i].x;
  o=ov(o,vec3(1.),.14*arcA(p,uR2,uSw*.4,uDa[i].x,span));
  if(uVal[i]>.02)o=ov(o,uCl[i],arcA(p,uR2,uSw*.45,uDa[i].x,span*min(uVal[i],1.)));}}
 if(uSeas>.5){float d=abs(length(p)-(uR2+4.5));o=ov(o,vec3(.992,.902,.541),.55*(1.-smoothstep(.0,1.,d)));}
 if(uDone>.5){vec2 c=vec2(1.,-1.)*(uR2+1.)*.72,q=(p-c)/uCk;float rq=length(q);
  float disc=1.-smoothstep(6.5,7.1,rq),ring=1.-smoothstep(.0,.6,abs(rq-7.1));
  o=ov(o,vec3(.02,.067,.04),ring*.9);o=ov(o,vec3(.247,.725,.314),disc);
  float t=min(segD(q,vec2(-3.,.2),vec2(-1.,2.4)),segD(q,vec2(-1.,2.4),vec2(3.2,-2.4)));
  o=ov(o,vec3(.024,.129,.059),(1.-smoothstep(.9,1.5,t))*disc);}
 if(o.a<.003){gl_FragColor=vec4(0.);return;}
 float vis=1.;
 for(int k=0;k<8;k++){if(uOa[k]>0.){float cov=0.;
  for(int q=0;q<4;q++){vec2 sub=(q==0)?vec2(-.25,-.25):(q==1)?vec2(.25,-.25):(q==2)?vec2(-.25,.25):vec2(.25,.25);
   vec2 sp=uCen+p+sub;vec3 d=vec3((sp.x/uRes.x*2.-1.)*uTH.x,(1.-sp.y/uRes.y*2.)*uTH.y,-1.);
   vec3 c=uOc[k].xyz;float R=uOc[k].w,a=dot(d,d),bq=dot(d,c),cc=dot(c,c)-R*R,disc=bq*bq-a*cc;
   if(disc>0.){float t=(bq-sqrt(disc))/a;if(t>0.&&t<uZr)cov+=.25;}}
  vis*=1.-cov*uOa[k];}}
 gl_FragColor=o*uAlpha*vis;}`;
/* Feed lines in WebGL: one camera-facing ribbon per feed between two 3-D points. The depth buffer hides any part that passes behind a nearer sphere.
   Brightening segment + soft bloom are painted in the fragment shader along the ribbon (coordinates in screen px, so speed is unchanged). */
const FVERT=`uniform vec3 uA,uB;uniform vec2 uRes;uniform float uHW,uPad;varying float vSW;varying float vW;varying float vV;varying float vLp;
void main(){mat4 VP=projectionMatrix*viewMatrix;vec4 cA=VP*vec4(uA,1.),cB=VP*vec4(uB,1.);float e=position.x;vec4 c=mix(cA,cB,e);
 vec2 sA=cA.xy/cA.w*uRes*.5,sB=cB.xy/cB.w*uRes*.5;float L=max(length(sB-sA),1.);vec2 d=(sB-sA)/L,n=vec2(-d.y,d.x);float sg=position.y;
 vec2 off=(n*sg*uHW+d*(e*2.-1.)*uPad)/(uRes*.5);gl_Position=vec4(c.xy+off*c.w,c.z,c.w);
 float sig=e+(e*2.-1.)*uPad/L;vSW=sig*c.w;vW=c.w;vV=sg*uHW;vLp=L;}`;
const FFRAG=`uniform vec3 uHue,uHot;uniform float uFw,uEa,uHead,uSeg,uBc,uBrx,uBry,uBo,uLine,uPl,uPt,uT,uK,uLod;varying float vSW;varying float vW;varying float vV;varying float vLp;
float hh(float x){return fract(sin(x*12.9898)*43758.5453);}
void main(){float L=vLp,s=vSW/vW*L,av=abs(vV);
 float inside=smoothstep(-.5,.5,s)*(1.-smoothstep(L-.5,L+.5,s));
 float core=(1.-smoothstep(uFw*.5-.5,uFw*.5+.5,av))*inside,und=(1.-smoothstep(uFw*.5+.75,uFw*.5+1.75,av))*inside;
 /* comet: tt=0 at the tail (child side) .. 1 at the head (parent side); brightness climbs along the trail to a bright head, then drops off sharply */
 float tt=(s-(uHead-uSeg))/uSeg;float g=(tt<=0.||tt>=1.)?0.:pow(tt,2.2)*(1.-smoothstep(.93,1.,tt));
 /* platinum only: a slow sheen travelling toward the parent plus fine brushed-metal streaks along the line */
 float sh=0.,br=0.;if(uPt>0.){float p=s*.05-uT*1.3;sh=pow(.5+.5*sin(p),6.)*.6+.15*pow(.5+.5*sin(p*.37+1.7),3.);float h=fract(sin(floor(vV*1.7+9.)*127.1+floor(s*.12)*311.7)*43758.5453);br=(h-.5)*.16;}
 vec3 base=mix(uHue,vec3(1.),sh*.5);float lg=uLine*(1.+sh*.55+br);vec3 ex=vec3(0.);
 /* platinum conduit detail, laid out in WORLD units (sw,vw) and faded in with on-screen size (uLod): tube shading, twin rails, segment joints with rivets, occasional junction nodes, and tiny lights streaming toward the parent. Invisible at normal zoom, resolves when zoomed far in. */
 if(uPt>0.&&uLod>.002){float sw=s/uK,vw=vV/uK,wh=uFw*.5/uK,n=vV/(uFw*.5),an=abs(n),P=3.,jt=fract(sw/P),dj=min(jt,1.-jt)*P;
  lg*=mix(1.,.42*(.6+.4*sqrt(max(0.,1.-n*n))),uLod);base=mix(base,uHue*.85,uLod);
  lg*=1.+uLod*.35*(1.-smoothstep(0.,.07,abs(an-.58)));
  lg*=1.-uLod*.45*(1.-smoothstep(0.,.12,dj))*(1.-smoothstep(.85,1.,an));
  ex+=vec3(.95,.97,1.)*uLod*.9*(1.-smoothstep(.07*wh,.15*wh,length(vec2(dj,(an-.8)*wh))))*step(an,1.);
  float cl=floor(sw/(P*6.));if(hh(cl+3.1)>.78){float r=length(vec2(sw-(cl+.5)*P*6.,vw));ex+=vec3(.55,.7,.95)*uLod*(.45*(1.-smoothstep(wh*1.15,wh*1.45,r))+.8*smoothstep(wh*1.2,wh*1.3,r)*(1.-smoothstep(wh*1.35,wh*1.5,r)));}
  for(int l=0;l<2;l++){float ln=l==0?-.32:.32,x=(sw-uT*7.)/3.2+float(l)*.37,id=floor(x);if(hh(id+float(l)*7.3)>.62){vec2 d=vec2((fract(x)-.5)*3.2,vw-ln*wh);float dot_=1.-smoothstep(.1*wh,.2*wh,length(d));vec3 lc=hh(id*1.7)>.5?vec3(1.,.82,.5):vec3(.6,.9,1.);ex+=lc*dot_*uLod*1.25;}}
 }
 float pm=(1.-smoothstep(uFw*.5+.5,uFw*.5+2.5,av))*inside*g;vec3 rgb=(base*lg*(core+.2*und)+(uHot*.9+.35)*pm*1.5*uPl+ex*inside)*uEa;
 vec2 q=vec2((s-uBc)/uBrx,vV/uBry);float rr=length(q);
 if(rr<1.&&uBo>0.){float ba=rr<.45?mix(.55,.22,rr/.45):mix(.22,0.,(rr-.45)/.55);vec3 bc=rr<.45?mix(uHot,uHue,rr/.45):uHue;rgb+=(bc*.8+.3)*ba*1.25*uBo;}
 rgb=min(rgb,vec3(1.));gl_FragColor=vec4(rgb,max(rgb.r,max(rgb.g,rgb.b)));}`;
const RIB=(()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([0,-1,0,0,1,0,1,-1,0,1,1,0]),3));g.setIndex([0,1,2,2,1,3]);return g})(),COR=new THREE.PlaneGeometry(2,2),SPH=new THREE.SphereGeometry(1,48,32),SPHL=new THREE.SphereGeometry(1,24,16),ICO=new THREE.IcosahedronGeometry(1,0);
const UN=(()=>{const a=[];for(let i=0;i<=96;i++){const t=i/96*Math.PI*2;a.push(new THREE.Vector3(Math.cos(t),0,Math.sin(t)))}return new THREE.BufferGeometry().setFromPoints(a)})();
function hex(c){return new THREE.Color(c)}
const dw=(m,a)=>{m.transparent=a<.99;m.depthWrite=a>.3};
/* r23: light direction = from the ancestor PLANET's centre toward the star's world position, shared by the planet and every moon / group / moonlet of that planet (the moon systems are drawn compressed, so a per-body direction to the star would differ wildly and even flip) */
function planetMat(m,seed,hue,sun,ref){return new THREE.ShaderMaterial({vertexShader:PVERT,fragmentShader:PFRAG,transparent:true,uniforms:{uM:{value:m},uSeed:{value:seed},uAlpha:{value:1},uTime:{value:0},uHue:{value:hex(hue)},uSun:{value:sun},uRef:{value:ref},uOcc:{value:Array.from({length:8},()=>new THREE.Vector4())},uOccN:{value:0}}})}
function orbitLine(op){return new THREE.LineLoop(UN,new THREE.LineBasicMaterial({color:0x8fa3c0,transparent:true,opacity:op,depthWrite:false}))}
const hs=str=>{let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0)/4294967296};
/* lumpy rock: icosphere with per-vertex jitter keyed by position so shared vertices move together (no cracks) */
const ICO2=(()=>{const g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),h=hs(x.toFixed(3)+','+y.toFixed(3)+','+z.toFixed(3)),h2=hs(Math.round(x*2)+'|'+Math.round(y*2)+'|'+Math.round(z*2)),r=.84+.2*h+.12*h2;p.setXYZ(i,x*r,y*r,z*r)}g.computeVertexNormals();return g})();

/* ---------- bodies ---------- */
const gFeed=E('g',{class:'feeds'}),gS=E('g'),gP=E('g'),gM=E('g'),gG=E('g'),gA=E('g');
const svg=E('svg',{class:'sgs',role:'group','aria-label':'Solar-system skill map. Tab walks the objects you can open. Enter opens, Escape goes back one level, plus and minus zoom.'});
const defs=E('defs');svg.appendChild(defs);[gFeed,gS,gP,gM,gG,gA].forEach(g=>svg.appendChild(g));stage.insertBefore(svg,cv.nextSibling);
const live=document.createElement('div');live.className='sgs-live';live.setAttribute('role','status');live.setAttribute('aria-live','polite');stage.appendChild(live);
const bodies=[],byRef=new Map();
const hud=document.createElement('aside');hud.className='sgs-hud';hud.setAttribute('aria-label','Selection details');hud.hidden=true;stage.appendChild(hud);

function mkRings(hue){
 const u={uExt:{value:30},uAlpha:{value:1},uR1:{value:10},uR2:{value:14},uSw:{value:3},uShare:{value:0},uSeas:{value:0},uDone:{value:0},uCk:{value:1},uHue:{value:hex(hue)},uVal:{value:new THREE.Vector3(-1,-1,-1)},
  uDa:{value:DIMS.map(d=>new THREE.Vector2(d.a0*Math.PI/180,d.a1*Math.PI/180))},uCl:{value:DIMS.map(d=>hex(d.c))},
  uCen:{value:new THREE.Vector2()},uRes:{value:new THREE.Vector2(1,1)},uTH:{value:new THREE.Vector2(1,1)},uZr:{value:0},uOc:{value:Array.from({length:8},()=>new THREE.Vector4())},uOa:{value:new Array(8).fill(0)}};
 const mesh=new THREE.Mesh(COR,new THREE.ShaderMaterial({vertexShader:CVERT,fragmentShader:RFRAG,transparent:true,depthWrite:false,depthTest:false,premultipliedAlpha:true,uniforms:u}));
 mesh.frustumCulled=false;mesh.renderOrder=3;mesh.visible=false;scene.add(mesh);return{mesh,u}}
const camUp=new THREE.Vector3();
function setRings(b,st,px,w,vis,al){const o=b.rings,u=o.u;
 if(!PRG||!vis||al<.015||b.cz<=1){o.mesh.visible=false;return}
 const tr=Math.max(px,b.tr||px),r1=tr+3.5+w*.4,r2=r1+4+w*.4,sw=2+w*.5,ext=r2*1.3+14;
 u.uExt.value=ext;u.uAlpha.value=al;u.uR1.value=r1;u.uR2.value=r2;u.uSw.value=sw;u.uShare.value=st.share;
 u.uVal.value.set(st.uv==null?-1:st.uv,st.fv==null?-1:st.fv,st.tv==null?-1:st.tv);
 u.uSeas.value=(st.mast/Math.max(1,st.n)>=.9&&st.uv>=.8&&st.tv>=.75)?1:0;u.uDone.value=(st.done&&px>=8)?1:0;u.uCk.value=clamp(px/16,.7,1.1);
 /* occluders: every OTHER visible sphere whose front surface is nearer than this ring's plane (the plane through the body centre) and that overlaps the ring on screen.
    The shader intersects each pixel's view ray with those spheres, so this body's own sphere never hides its ring and any nearer body always does. */
 const cand=[];for(const c of bodies){if(c===b||!c.vis||c.alpha<.05||!c.wr||c.cz<=1)continue;if(c.cz-c.wr>=b.cz)continue;
  const dx=c.sx-b.sx,dy=c.sy-b.sy,R=c.tr+ext;if(dx*dx+dy*dy>R*R)continue;cand.push(c)}
 cand.sort((p,q)=>(p.cz-p.wr)-(q.cz-q.wr));
 for(let i=0;i<8;i++){const c=cand[i];if(c){u.uOc.value[i].set(c.cvx,c.cvy,-c.cz,c.wr);u.uOa.value[i]=clamp((c.alpha-.15)/.5,0,1)}else u.uOa.value[i]=0}
 u.uCen.value.set(b.sx,b.sy);u.uRes.value.set(W,H);u.uTH.value.set(TANH*camera.aspect,TANH);u.uZr.value=b.cz;
 o.mesh.position.copy(b.pos);o.mesh.quaternion.copy(camera.quaternion);o.mesh.scale.setScalar(ext*wppAt(b.pos));o.mesh.visible=true}
function mkBody(kind,ref,o){
 const b=Object.assign({kind,ref,id:ref.id,hrs:ref.hrs||0,occS:0,tr:0,cz:0,alpha:0,lalpha:0,px:0,sx:0,sy:0,dep:1,pos:new THREE.Vector3(),vis:false,hit:false,tab:false,lab:null,w:{}},o);
 const g=E('g',{class:'k-'+kind,'data-kind':kind,'data-id':b.id,role:'button',tabindex:-1,'aria-label':b.aria||b.id},{star:gS,planet:gP,moon:gM,group:gG,ast:gA}[kind]);
 g.style.display='none';b.g=g;b.title=E('title',{});/* detached on purpose: native title tooltips would stack on our own hover pop-up */b.hitC=E('circle',{class:'hit',r:10},g);
 if(b.stats&&kind!=='ast')b.rings=mkRings(b.hue);
 b.fr=E('circle',{class:'fr',r:12},g);
 b.t1=E('text',{class:'lb1'});b.t2=E('text',{class:'lb2'});/* detached text holders: labels are drawn in-scene (see labelTex/placeLabel) */bodies.push(b);byRef.set(ref,b);return b}

const sysList=[],AST={},GRP={};

/* ---------- orbit path rings: a depth-tested ribbon of constant pixel width, same centre/radius/plane as the orbit it shows ---------- */
/* RULE (r14): orbit rings are drawn only for the children of the focused body (galaxy: each star's planets; star view: that star's planets; planet: its moons; moon: its groups/skills; group: its skills); a body's own orbit and sibling/deeper rings are never drawn. */
/* RULE (r13): an orbit line is never drawn over any visible body. Every orbit ring is clipped, in the fragment shader, wherever it falls inside the on-screen disc (+3px) of ANY rendered body (own body included), so rings only appear in the space between bodies. */
const ORBMAX=160,ORBU={uD:{value:Array.from({length:ORBMAX},()=>new THREE.Vector3())},uN:{value:0}};
const OVERT=`attribute float aSide;uniform vec2 uRes;uniform float uW;varying float vS;varying vec2 vScr;
void main(){vec3 p=position;vec3 tg=vec3(-p.z,0.,p.x);mat4 M=projectionMatrix*viewMatrix*modelMatrix;vec4 c0=M*vec4(p,1.);vec4 c1=M*vec4(p+tg*.02,1.);
 vec2 s0=c0.xy/c0.w*uRes*.5,s1=c1.xy/c1.w*uRes*.5;vec2 d=s1-s0;d=length(d)>1e-5?normalize(d):vec2(1.,0.);vec2 n=vec2(-d.y,d.x);
 vec2 off=n*aSide*(uW*.5+.8)/(uRes*.5);gl_Position=c0;gl_Position.xy+=off*c0.w;vS=aSide;vScr=gl_Position.xy/gl_Position.w*uRes*.5;}`;
const OFRAG=`uniform vec3 uCol;uniform float uA,uW,uN;uniform vec3 uD[${ORBMAX}];varying float vS;varying vec2 vScr;
void main(){for(int i=0;i<${ORBMAX};i++){if(float(i)>=uN)break;vec3 q=uD[i];vec2 dd=vScr-q.xy;if(dot(dd,dd)<q.z*q.z)discard;}
 float core=(uW*.5)/(uW*.5+.8);float a=uA*(1.-smoothstep(core,1.,abs(vS)));if(a<.004)discard;gl_FragColor=vec4(uCol,a);}`;
const ORBG=(()=>{const N=256,pos=new Float32Array((N+1)*2*3),sd=new Float32Array((N+1)*2),idx=[];for(let i=0;i<=N;i++){const t=i/N*Math.PI*2,c=Math.cos(t),s=Math.sin(t);for(let k=0;k<2;k++){const v=i*2+k;pos.set([c,0,s],v*3);sd[v]=k?1:-1}if(i<N){const a=i*2,b=a+1,c2=a+2,d=a+3;idx.push(a,b,c2,b,d,c2)}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aSide',new THREE.BufferAttribute(sd,1));g.setIndex(idx);return g})();
const ORBITS=[];let ORB=true,PRG=true,LNS=true;try{LNS=localStorage.getItem('sg-solar-lines')!=='off';ORB=localStorage.getItem('sg-solar-orbits')!=='off';PRG=localStorage.getItem('sg-solar-progress')!=='off'}catch(e){}
function mkOrbit(rank,lvl){const a0=.5,w0=1.8;/* r15: one uniform ring colour/brightness (half of the old innermost) and one width; no inner-first tiers */
 const m=new THREE.Mesh(ORBG,new THREE.ShaderMaterial({vertexShader:OVERT,fragmentShader:OFRAG,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,uniforms:{uCol:{value:new THREE.Color(0xd2e0f7)},uA:{value:0},uW:{value:w0},uRes:{value:new THREE.Vector2(1,1)},uD:ORBU.uD,uN:ORBU.uN}}));
 m.frustumCulled=false;m.renderOrder=1;m.visible=false;scene.add(m);const o={mesh:m,al:0,rank,a0,w0,pos:new THREE.Vector3(),R:0,q:new THREE.Quaternion(),bp:new THREE.Vector3(),br:0};ORBITS.push(o);return o}
const setOrb=(o,c,R,q,al,bp,br)=>{o.pos.copy(c);o.R=R;o.q=q;if(bp){o.bp.copy(bp);o.br=br}if(al>o.al)o.al=al};
/* 3-D layout: each star sits at its own height; every orbit lies in its own tilted plane (quaternion q = inclination about x, then node angle about y) */
const YOFF={math:0,chem:420,span:-360,phys:300,bio:-470,eng:560,hist:-250};
const orbQ=(id,amp)=>new THREE.Quaternion().setFromEuler(new THREE.Euler((hs(id+'i')-.5)*amp,hs(id+'n')*6.283,0,'YXZ'));

/* ---------- orbit layout: collision-free by construction ----------
   Every parent's children sit on concentric shells ("rings"). Within a ring the children are evenly spaced and share one angular speed, so their separation never changes; ring radii are spaced by (outer radius of the inner ring + gap + radius of the outer ring), so bodies on different rings can never touch whatever their tilt (they stay on spheres of different radius around the parent). A child's extent (its own orbit rings + radius) is what its siblings are spaced by, so subsystems never intersect. All orbits run in the same (prograde) direction; every ring plane is the parent's plane tilted by <= 0.25 rad. Two states per parent (compact / expanded) share ring membership, so the spacing guarantee also holds for every blend in between. */
const GOLD=2.39996;let KS=1;const GATE=.8;const GAPC=2,GAPE=7,GAPP=3,RMARG=3,CAP=12,MV=64,GV=70,W0=1100,H0=620,FITX=.47;
const fo=x=>ss(x,0,.4),ex=x=>ss(x,.4,1);
const HM=SOL.HM,uK=(h,k)=>clamp(Math.sqrt(h/HM[k]),.1,1),uS=h=>clamp(Math.cbrt(h/HM.star),.38,1);
const P0=u=>2.8+3.6*u,P1=u=>(6.5+15*u)*KS,P2=58,M1=(u,sk)=>Math.max(1.8,(sk?2.4+2.6*u:2.2+3*u)*KS),M2=(u,sk)=>sk?7+5*u:5+13*u;
const S0=u=>8+14*u,S1=u=>14+27*u;
const gpx0=u=>3.4+3*u,gpx3=u=>12+18*u,apxC=u=>3.2+2.6*u,apxE=u=>8+9*u;
/* r21 SHELL RULE: a child's whole system (its radius, or its orbit radius + its own system extent, recursively) occupies the annulus [R-ext, R+ext] around the parent; consecutive annuli never overlap (R_i - ext_i >= R_{i-1} + ext_{i-1} + gap) at every compact->expanded blend, so no subsystem ever crosses a neighbouring orbit path. Planets of one star keep the older pair-distance rule: the shell rule for them would need the sum of 2x(planet+compact moon system extent) to fit the window radius (about 2400 px for Math vs ~500 px available), which is not achievable at readable sizes. */
/* Every child gets its own orbit: radii strictly increase in prerequisite order (first-learned closest). All children of one parent share a plane and one angular speed and sit at golden-angle offsets, so pair distances are constant; radii grow until every pair clears (extent+extent+gap) at every compact→expanded blend. it[i]=[bodyC,bodyE,extC,extE]. */
const WS9=[0,.125,.25,.375,.5,.625,.75,.875,1];
function pairLayout(it,parC,gC,parE,gE){const n=it.length,bod=(i,w)=>lerp(it[i][0],it[i][1],w),ext=(i,w)=>Math.max(bod(i,w),lerp(it[i][2],it[i][3],w)),par=w=>lerp(parC,parE,w),gg=w=>lerp(gC,gE,w),stp=(i,w)=>Math.max(3,.6*(bod(i-1,w)+bod(i,w)));
 const Rc=[],Re=[],GA=GOLD;
 for(let i=0;i<n;i++){const lo=w=>Math.max(par(w)+gg(w)+ext(i,w),i?Math.max((w===0?Rc[i-1]:Re[i-1])+stp(i,w),(w===0?Rc[i-1]:Re[i-1])+ext(i-1,w)+gg(w)+ext(i,w)):0);
  const c0=lo(0),e0=lo(1),kk=e0/c0;let d=0;
  for(let g=0;g<5000;g++){const ci=c0+d,ei=e0+d*kk;let ok=true;
   if(i)for(let t=0;t<9&&ok;t++){const w=WS9[t],a=lerp(ci,ei,w),b=lerp(Rc[i-1],Re[i-1],w);if(a-ext(i,w)<b+ext(i-1,w)+gg(w))ok=false}
   if(ok)break;d+=Math.max(.5,c0*.006)}
  Rc.push(c0+d);Re.push(e0+d*kk)}
 const mk=(R,w)=>({rings:R.map((r,k)=>({R:r,idx:[k],n:1,rm:ext(k,w)})),slot:R.map((r,k)=>({k,a:0,n:1})),ext:n?R[n-1]+ext(n-1,w):parC});
 return{c:mk(Rc,0),e:mk(Re,1)}}
function layoutChildren(){SOL.systems.forEach(y=>y.planets.forEach(p=>p.moons.forEach(m=>{
 const sk=!!m.skill,u=uK(m.hrs,sk?'smoon':'moon'),m2=M2(u,sk);let ext=m2;m.gL=m.aL=null;
 if(m.groups){m.groups.forEach(g=>{const gu=uK(g.hrs,'group');g._u=gu;const A=g.asts.map(s=>apxC(uK(s.hrs,'ast'))),B=g.asts.map(s=>apxE(uK(s.hrs,'ast')));g.aL=pairLayout(A.map((a,i)=>[a,B[i],a,B[i]]),gpx3(gu),GAPC,GV,GAPE);g.Eg=gpx3(gu)});
  m.gL=pairLayout(m.groups.map(g=>[gpx0(g._u),gpx3(g._u),gpx0(g._u),gpx3(g._u)]),m2,GAPC,MV,GAPE);ext=Math.max(m2,m.gL.c.ext)}
 else if(m.asts.length){const A=m.asts.map(s=>apxC(uK(s.hrs,'ast'))),B=m.asts.map(s=>apxE(uK(s.hrs,'ast')));m.aL=pairLayout(A.map((a,i)=>[a,B[i],a,B[i]]),m2,GAPC,MV,GAPE);ext=Math.max(m2,m.aL.c.ext)}
 m.Ep=Math.max(ext,34)})))}
function layoutPlanets(){SOL.systems.forEach(y=>y.planets.forEach(p=>{const u=uK(p.hrs,'planet');p._u=u;
 p.mL=pairLayout(p.moons.map(m=>{const b1=M1(uK(m.hrs,m.skill?'smoon':'moon'),!!m.skill);const b2=M2(uK(m.hrs,m.skill?'smoon':'moon'),!!m.skill);return[b1,b2,b1,b2]}),P1(u),GAPC,P2,GAPE);p.Ec=P1(u)}))}
/* Planets of one star share one orbital plane and one angular speed (rigid rotation), each at its own radius and a fixed golden-angle offset, so every planet-to-planet distance is constant over time; radii are grown until each pair's constant distance clears (extent of one + extent of the other + margin) at every zoom blend. */
function planetPlace(y,wRf,lvs){const n=y.planets.length,us=uS(y.hrs),dRm=new Array(n).fill(0),RinI=new Array(n).fill(0);let Rext=0;
 /* r22: a view draws only the focused body + its direct children, so a planet's extent here is just its own radius (+ a small margin); shell rule R_i-r_i >= R_{i-1}+r_{i-1}+gap at every blend where planets are visible (lv>=.8) */
 lvs.filter(lv=>lv>=.8).forEach(lv=>{const w=wRf(lv),a=ss(lv,0,1),sp=lerp(S0(us),S1(us),a),px=y.planets.map(p=>lerp(P0(p._u),P1(p._u),a));
  for(let i=0;i<n;i++)RinI[i]=Math.max(RinI[i],(sp+px[i]+RMARG)*w);Rext=Math.max(Rext,px[n-1]*w);
  for(let i=1;i<n;i++)dRm[i]=Math.max(dRm[i],(px[i-1]+px[i]+GAPP)*w)});
 const R=[];for(let i=0;i<n;i++)R.push(Math.max(i?R[i-1]+dRm[i]:0,RinI[i]));
 return{R,Rext:R[n-1]+Rext}}
function worldLayout(){const ys=SOL.systems,orig=ys.map(y=>y.pos.slice()),sysW0=R=>Math.max(.9,R*SINE/(H0*.43),R/(W0*FITX));
 for(let g=0;g<60;g++){layoutPlanets();const need=Math.max(...ys.map(y=>{const R=planetPlace(y,()=>1,[1]).R;const r=R[R.length-1]+y.planets[R.length-1].Ec;return Math.max(r/(W0*FITX),r*SINE/(H0*.43))}));if(need<=.9)break;KS*=.97}
 let wg=5.4;ys.forEach(y=>y.w1=1.4);const info={};
 for(let it=0;it<14;it++){
  ys.forEach(y=>{let w1=y.w1,res;for(let k=0;k<120;k++){const wRf=lv=>Math.exp(lerp(Math.log(wg),Math.log(w1),ss(lv,0,1)));res=planetPlace(y,wRf,LVS);const nw=Math.min(60,sysW0(res.R[res.R.length-1]));if(Math.abs(nw-w1)<.001*w1){w1=nw;break}w1+=(nw-w1)*.6}
   y.w1=w1;y.planets.forEach((p,i)=>p.R=res.R[i]);y.Rmax=res.R[res.R.length-1];y.Rext=res.Rext});
  {const P=ys.map((y,i)=>[orig[i][0],orig[i][1]]);for(let r=0;r<400;r++){let moved=false;for(let i=0;i<ys.length;i++)for(let j=i+1;j<ys.length;j++){const dy=(YOFF[ys[i].id]||0)-(YOFF[ys[j].id]||0),need=ys[i].Rext+ys[j].Rext+80,dx=P[i][0]-P[j][0],dz=P[i][1]-P[j][1],dxz=Math.hypot(dx,dz)||1,d3=Math.hypot(dxz,dy);
    if(d3<need){const want=Math.sqrt(Math.max(0,need*need-dy*dy)),push=(want-dxz)/2+.5,ux=dx/dxz,uz=dz/dxz;P[i][0]+=ux*push;P[i][1]+=uz*push;P[j][0]-=ux*push;P[j][1]-=uz*push;moved=true}}if(!moved)break}
   ys.forEach((y,i)=>{y.pos=[P[i][0],P[i][1]]})}
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;ys.forEach(y=>{const R=y.Rmax+60;x0=Math.min(x0,y.pos[0]-R);x1=Math.max(x1,y.pos[0]+R);z0=Math.min(z0,y.pos[1]-R);z1=Math.max(z1,y.pos[1]+R)});
  const nwg=Math.max((x1-x0)/(W0*.92),(z1-z0)*SINE/(H0*.70));if(Math.abs(nwg-wg)<.002*wg)break;wg+=(nwg-wg)*.7}
 info.wg=wg;info.KS=KS;SOL.layoutInfo=info;ys.forEach(y=>{y.wgd=wg})}
const LVS=Array.from({length:21},(_,t)=>t/20);
const mkRing=(id,n,pq,T0)=>{const q=pq.clone().multiply(orbQ(id,.5)),b=hs(id+'r')*6.283;return Array.from({length:n},(_,k)=>({q,T:T0,th0:b+k*GOLD}))};
layoutChildren();worldLayout();
SOL.systems.forEach((y,yi)=>{
 const S={y,q:orbQ(y.id+'p',.5),id:y.id,u:Math.max(.38,Math.min(1,Math.cbrt(y.hrs/SOL.HM.star))),pos:new THREE.Vector3(y.pos[0],YOFF[y.id]||0,y.pos[1]),planets:[],ws:0,alpha:1,started:y.stats.started>0};
 const col=hex(y.color);
 S.mesh=new THREE.Mesh(SPH,new THREE.ShaderMaterial({vertexShader:PVERT,fragmentShader:SFRAG,transparent:true,uniforms:{uCol:{value:col},uAlpha:{value:1},uBright:{value:S.started?1:.5},uTime:{value:0},uSeed:{value:hs(y.id)*5}}}));scene.add(S.mesh);
 S.cor=new THREE.Mesh(COR,new THREE.ShaderMaterial({vertexShader:CVERT,fragmentShader:CFRAG,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uCol:{value:col},uAlpha:{value:1},uTime:{value:0},uSeed:{value:hs(y.id)*5},uFlare:{value:1}}}));S.cor.frustumCulled=false;S.cor.renderOrder=2;scene.add(S.cor);
 S.glow=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:col,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));S.glow.renderOrder=1;scene.add(S.glow);
 S.b=mkBody('star',y,{hue:y.color,stats:y.stats,hrs:y.hrs,aria:y.name+' star. '+y.n+' domains, '+pct(y.stats.share)+' percent of skills solid. Press Enter to open.',sys:S});
 S.b.t1.textContent=y.name;S.b.t2.textContent=y.n+' domains · '+pct(y.stats.share)+'% solid';
 S.b.title.textContent=y.name+': '+y.n+' domains, '+y.skills.length+' skills';
 y.planets.forEach(p=>{
  const P={p,S,u:Math.max(.1,Math.min(1,Math.sqrt(p.hrs/SOL.HM.planet))),wp:0,wcm:0,alpha:1,q:S.q,pos:new THREE.Vector3(),th0:hs(y.id)*6.283+p.i*GOLD,T:220,moons:[]};P.mL=p.mL;P.mR=mkRing(p.id+':m',p.mL.c.rings.length,P.q,38,16);P.tp=0;
  P.orb=mkOrbit(p.i/Math.max(1,y.planets.length-1),0);P.mO=P.mR.map((r,k)=>mkOrbit(k/Math.max(1,P.mR.length-1),1));
  P.mesh=new THREE.Mesh(SPH,planetMat(clamp(p.stats.know,0,1),hs(p.id)*3,p.hue,S.pos,P.pos));scene.add(P.mesh);
  const nm=p.moons.length;
  P.b=mkBody('planet',p,{hue:p.hue,stats:p.stats,P,aria:p.name+' planet, '+nm+' topics, '+pct(p.stats.share)+' percent solid. Press Enter to open.'});
  P.b.par=S.b;P.b.oq=P.q;P.b.t1.textContent=p.short;P.b.t2.textContent=pct(p.stats.share)+'% solid';P.b.title.textContent=p.name+': '+nm+' topics, '+p.skills.length+' skills';
  p.moons.forEach(m=>{
   const M={m,P,u:Math.max(.1,Math.min(1,Math.sqrt(m.hrs/SOL.HM[m.skill?'smoon':'moon']))),alpha:0,wm:0,tm:0,wam:0,j:m.j,pos:new THREE.Vector3(),T:38+11*m.j,asts:[]};
   M.mesh=new THREE.Mesh(SPHL,planetMat(clamp(m.stats.know,0,1),hs(m.id)*3,p.hue,S.pos,P.pos));M.mesh.visible=false;scene.add(M.mesh);
   {const sl=P.mL.c.slot[m.j];M.pq=P.mR[sl.k].q}
   const sk=m.skill;
   M.b=mkBody('moon',m,{hue:p.hue,stats:m.stats,M,aria:m.name+(sk?', '+SG.statusText(sk):' topic, '+m.skills.length+' skills, '+pct(m.stats.share)+' percent solid')+'. Press Enter.'});
   M.b.par=P.b;M.b.oq=M.pq;M.b.t1.textContent=m.name;M.b.t2.textContent=sk?SG.statusText(sk):m.skills.length+' skills · '+pct(m.stats.share)+'%';M.b.title.textContent=m.name+(sk?'':': '+m.skills.length+' skills');
   M.groups=[];M.wgx=0;M.gL=m.gL;M.aL=m.aL;M.gR=m.gL?mkRing(m.id+':g',m.gL.c.rings.length,M.pq,60,26):null;M.aR=m.aL?mkRing(m.id+':a',m.aL.c.rings.length,M.pq,18,8):null;M.gO=M.gR?M.gR.map((r,k)=>mkOrbit(k/Math.max(1,M.gR.length-1),2)):null;M.aO=M.aR?M.aR.map((r,k)=>mkOrbit(k/Math.max(1,M.aR.length-1),3)):null;
   if(m.groups)m.groups.forEach(g=>{
    const G={g,M,u:Math.max(.1,Math.min(1,Math.sqrt(g.hrs/SOL.HM.group))),j:g.j,n:g.n,alpha:0,wg:0,tg:0,wam:0,px:0,pos:new THREE.Vector3()};{const sl=M.gL.c.slot[g.j];G.pq=M.gR[sl.k].q;G.aL=g.aL;G.aR=mkRing(g.id+':a',g.aL.c.rings.length,G.pq,18,8);G.aO=G.aR.map((r,k)=>mkOrbit(k/Math.max(1,G.aR.length-1),3))}
    G.mesh=new THREE.Mesh(SPHL,planetMat(clamp(g.stats.know,0,1),hs(g.id)*3,p.hue,S.pos,P.pos));G.mesh.visible=false;scene.add(G.mesh);
    G.b=mkBody('group',g,{hue:p.hue,stats:g.stats,G,aria:g.name+' group of '+m.name+', '+g.n+' skills, '+pct(g.stats.share)+' percent solid. Press Enter.'});
    G.b.par=M.b;G.b.oq=G.pq;G.b.t1.textContent=g.name;G.b.t2.textContent=g.n+' skills · '+pct(g.stats.share)+'%';G.b.title.textContent=g.name+' · '+m.name+': '+g.n+' skills';GRP[g.id]=G;M.groups.push(G)});
   m.asts.forEach((s,k)=>{
    const A={s,M,k,u:Math.max(.1,Math.min(1,Math.sqrt(s.hrs/SOL.HM.ast))),G:s._grp?GRP[s._grp.id]:null,gk:s._grp?s._grp.asts.indexOf(s):0,alpha:0,wa:0,ta:0,pos:new THREE.Vector3(),rot:new THREE.Vector3(hs(s.id+'a')*6,hs(s.id+'b')*6,0),sc:new THREE.Vector3(.8+hs(s.id+'x')*.5,.7+hs(s.id+'y')*.4,.8+hs(s.id+'z')*.5)};
    AST[s.id]=A;A.b=mkBody('ast',s,{hue:SG.colorFor(s,'tier'),A,aria:s.name+', '+SG.statusText(s)});A.b.par=A.G?A.G.b:M.b;{const L=A.G?A.G.aL:M.aL,R=A.G?A.G.aR:M.aR,sl=L.c.slot[A.G?A.gk:k];A.b.oq=R[sl.k].q}A.b.t1.textContent=s.name;A.b.title.textContent=s.name+' · '+SG.statusText(s);
    M.asts.push(A)});
   P.moons.push(M)});
  S.planets.push(P)});
 sysList.push(S)});
const SYS={},PL={},MO={};sysList.forEach(S=>{SYS[S.id]=S;S.planets.forEach(P=>{PL[P.p.id]=P;P.moons.forEach(M=>MO[M.m.id]=M)})});
function astMesh(A){if(A.mesh)return A.mesh;A.mesh=new THREE.Mesh(SPHL,planetMat(clamp(SG.knowOf(A.s),0,1),hs(A.s.id)*3,A.M.P.p.hue,A.M.P.S.pos,A.M.P.pos));A.mesh.visible=false;scene.add(A.mesh);return A.mesh}

/* ---------- feed lines (learning flows from child to parent) ---------- */
const feeds=[];
/* A feed is the line child->parent. Its "pulse" is a brighter segment of the line itself: two overlay lines whose stroke is a linearGradient (transparent tail, bright body, soft head) that is re-aimed along the line every frame. The segment position is a phase f.ph in 0..1 that only ever increases, and the line always runs child -> parent, so the glow always travels toward the parent. */
/* r19 feed states: 0 not started (very faint line, no pulse), 1 in progress (faint line + inward pulse, faster as mastery rises), 2 mastered (solid bright line, no pulse). Mastered = skill p_known >= TH.mastered (0.85); a topic/domain/group is mastered when >=90% of its skills are (stats.done); not started = nothing at/above TH.started (0.10). Pulse speed follows pr = p_known (average for groups) / 0.85. */
/* r20 metal palette (sRGB): gray = not started; in-progress ramps iron -> copper -> bronze -> silver -> gold with pr = p_known/0.85; platinum = mastered */
const METAL=[[0,'#858a93'],[.25,'#d0804c'],[.5,'#b98a3e'],[.75,'#d3d9e2'],[1,'#ffd04a']].map(([p,c])=>[p,new THREE.Color(c)]),GRAYC=new THREE.Color('#8b9099'),PLATC=new THREE.Color('#eaf2ff');
const metalFor=(st,pr)=>{if(st===0)return GRAYC.clone();if(st===2)return PLATC.clone();for(let i=1;i<METAL.length;i++)if(pr<=METAL[i][0]||i===METAL.length-1){const a=METAL[i-1],b=METAL[i];return a[1].clone().lerp(b[1],clamp((pr-a[0])/(b[0]-a[0]),0,1))}};
const fInfo=(st,k)=>{const M=SG.TH.mastered;if(st==null){return[k>=M?2:(k>=SOL.ACTIVE_LO?1:0),clamp(k/M,0,1)]}if(st.n===1)return[st.mast>=1?2:(st.active>0?1:0),clamp(st.know/M,0,1)];return[st.done?2:(st.started>0?1:0),clamp(st.know/M,0,1)]};
function mkFeed(child,parent,hue,kind,inf){const f={a:child,b:parent,kind,hue,len:0,st:inf[0],pr:inf[1]},n=feeds.length;
 const fw=(kind==='planet'?3:(kind==='moon'||kind==='grp')?2.6:2.3)*(f.st===2?1.8:1),mc=metalFor(f.st,f.pr),hotC=mc.clone().lerp(new THREE.Color('#ffffff'),.65);f.fw=fw;
 f.mesh=new THREE.Mesh(RIB,new THREE.ShaderMaterial({vertexShader:FVERT,fragmentShader:FFRAG,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneFactor,
  uniforms:{uA:{value:new THREE.Vector3()},uB:{value:new THREE.Vector3()},uRes:{value:new THREE.Vector2(1,1)},uHW:{value:fw*1.5+4.5},uPad:{value:14},uHue:{value:mc},uHot:{value:hotC},uFw:{value:fw},uEa:{value:1},uHead:{value:0},uSeg:{value:30},uBc:{value:0},uBrx:{value:10},uBry:{value:5},uBo:{value:0},uLine:{value:[.16,.62,1.0][f.st]},uPl:{value:f.st===1?1:0},uPt:{value:f.st===2?1:0},uT:{value:0},uK:{value:1},uLod:{value:0}}}));
 f.mesh.frustumCulled=false;f.mesh.renderOrder=4;f.mesh.visible=false;scene.add(f.mesh);
 f.ph=hs(child.id)*.9;feeds.push(f)}
sysList.forEach(S=>{S.planets.forEach(P=>{mkFeed(P.b,S.b,P.p.hue,'planet',fInfo(P.p.stats));
 P.moons.forEach(M=>{mkFeed(M.b,P.b,P.p.hue,'moon',fInfo(M.m.stats));
  M.groups.forEach(G=>{mkFeed(G.b,M.b,P.p.hue,'grp',fInfo(G.g.stats))});M.asts.forEach(A=>{mkFeed(A.b,A.G?A.G.b:M.b,P.p.hue,'ast',fInfo(null,SG.knowOf(A.s)))})})})});

/* ---------- state ---------- */
let dragging=false,holdUntil=0,sup=0,yaw=0,pitch=EL,zf=1,yawT=0,pitchT=EL,zfT=1,dtS=.016,level=0,fSys=null,fPlanet=null,selMoon=null,selSkill=null,selMoonM=null,selAst=null,selGroup=null,viewMoon=null,viewAst=null,viewGroup=null,viewSys=SYS.math,viewPlanet=PL['math:fun']||sysList[0].planets[0];
let fitCur=1,lv=0,Tcur=new THREE.Vector3(),wppCur=3,W=1280,H=700,phaseLast=0,Pp=0,Pm=0,Pa=0,clock=0,hover=null,lastWheel=0;
const pan=new THREE.Vector3(),panT=new THREE.Vector3(),v3=new THREE.Vector3(),camPos=new THREE.Vector3(),fwd=new THREE.Vector3(),right=new THREE.Vector3(),tmp=new THREE.Vector3(),tmp2=new THREE.Vector3();
const sinPx=EL;
function galFit0(){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;sysList.forEach(S=>{const R=S.y.Rmax+60;x0=Math.min(x0,S.pos.x-R);x1=Math.max(x1,S.pos.x+R);z0=Math.min(z0,S.pos.z-R);z1=Math.max(z1,S.pos.z+R)});
 return{c:new THREE.Vector3((x0+x1)/2,0,(z0+z1)/2),w:Math.max((x1-x0)/(W*.92),(z1-z0)*SINE/(H*.70))}}
function galFit(){const r=galFit0();r.w=Math.min(r.w,SOL.layoutInfo.wg);return r}
function sysW(S){return Math.min(S.y.w1,Math.max(.9,S.y.Rmax*SINE/(H*.43),S.y.Rmax/(W*FITX)))}
const W2=.55,W3=.30,Wg=.22,W4=.16;
function resize(){W=stage.clientWidth;H=stage.clientHeight;renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();svg.setAttribute('viewBox','0 0 '+W+' '+H)}
new ResizeObserver(resize).observe(stage);resize();
const drawerOpen=()=>UI.draw.classList.contains('open');
function wppAt(p){return 2*TANH*Math.max(30,tmp2.copy(p).sub(camPos).dot(fwd))/H}
function projectTo(b,p){b.vd=tmp2.copy(p).sub(camPos).dot(fwd);tmp.copy(p).project(camera);b.zd=tmp.z;b.sx=(tmp.x*.5+.5)*W;b.sy=(-tmp.y*.5+.5)*H;b.ok=tmp.z<1}
const body={px:0};
function pxOf(b,v){return v}
const fmtH=h=>h>=1000?(h/1000).toFixed(1)+'k h':h>=100?Math.round(h/5)*5+' h':h>=10?Math.round(h)+' h':h.toFixed(1)+' h';

/* r24 shadow occluders: for every visible lit body, the (up to 8) visible bodies that can darken it = those on the star side whose shadow cylinder (radius + penumbra) reaches it, nearest to the ray first */
const SHL=[],SHC=[],shA=new THREE.Vector3(),shD=new THREE.Vector3();
let NOSH=new URLSearchParams(location.search).get('noshadow')==='1';/* test hook: shadows off for A/B shots */
function shadowPass(){SHL.length=0;const add=o=>{const m=o.mesh;if(m&&m.visible&&m.material.uniforms.uAlpha.value>.3)SHL.push(o)};
 sysList.forEach(S=>S.planets.forEach(P=>{add(P);P.moons.forEach(M=>{add(M);M.groups.forEach(add);M.asts.forEach(add)})}));
 for(const r of SHL){const u=r.mesh.material.uniforms,rr=r.mesh.scale.x;if(NOSH){u.uOccN.value=0;continue}shD.copy(u.uSun.value).sub(u.uRef.value).normalize();SHC.length=0;
  for(const o of SHL){if(o===r)continue;shA.copy(o.mesh.position).sub(r.mesh.position);const t=shA.dot(shD);if(t<=0)continue;const ro=o.mesh.scale.x,lat=Math.sqrt(Math.max(0,shA.lengthSq()-t*t));if(lat>ro+rr+1)continue;SHC.push([lat-ro,o])}
  SHC.sort((a,b)=>a[0]-b[0]);const n=Math.min(8,SHC.length);for(let i=0;i<n;i++){const o=SHC[i][1];u.uOcc.value[i].set(o.mesh.position.x,o.mesh.position.y,o.mesh.position.z,o.mesh.scale.x)}u.uOccN.value=n}}
function step(dt,now){
 dtS=dt;ORBITS.forEach(o=>o.al=0);const inst=RM();const k=(r)=>inst?1:1-Math.exp(-r*dt);const sn=(v,t)=>{v+=(t-v)*k(4.2);return Math.abs(v-t)<.002?t:v};
 // clocks
 const O=SG.orbit,ph=O?O.phase:0,dPh=Math.max(0,ph-phaseLast);phaseLast=ph;clock=ph;
 lv+=(level-lv)*k(4.2);if(Math.abs(lv-level)<.002)lv=level;
 sysList.forEach(S=>{const t=(level>=1&&fSys===S)?1:0;S.ws+=(t-S.ws)*k(4.2);if(Math.abs(S.ws-t)<.002)S.ws=t;S.planets.forEach(P=>{const tp=(level>=2&&fPlanet===P)?1:0;P.tp=tp;P.wp+=(tp-P.wp)*k(4.2);if(Math.abs(P.wp-tp)<.002)P.wp=tp;let mx=0;P.moons.forEach(M=>{M.tm=(level>=3&&selMoonM===M)?1:0;M.wm=sn(M.wm,M.tm);let ax=0,gx=0;M.groups.forEach(G=>{G.tg=selGroup===G?1:0;G.wg=sn(G.wg,G.tg);G.wam=0;gx=Math.max(gx,G.wg)});M.asts.forEach(A=>{A.ta=selAst===A?1:0;A.wa=sn(A.wa,A.ta);ax=Math.max(ax,A.wa);if(A.G)A.G.wam=Math.max(A.G.wam,A.wa)});M.wgx=gx;M.wax=ax;M.wam=Math.max(ax,gx);mx=Math.max(mx,M.wm)});P.wcm=mx})});
 const a=ss(clamp(lv,0,1),0,1),bb=ss(clamp(lv-1,0,1),0,1),wL2=bb,bf=ss(clamp(lv-1,0,1),0,.4);
 Pp+=dPh*(1-wL2);const wc3=ss(clamp(lv-2,0,1),0,1);Pm+=dPh*(1-.85*wc3);Pa+=dPh*(1-.8*wc3);
 // planet positions (world)
 sysList.forEach(S=>S.planets.forEach(P=>{const t=P.th0+Pp*2*Math.PI/P.T;P.pos.set(Math.cos(t),0,Math.sin(t)).applyQuaternion(P.q).multiplyScalar(P.p.R).add(S.pos)}));
 // camera
 const g=galFit(),Sv=viewSys,Pv=viewPlanet,Mv=viewMoon,Gv=viewGroup,Av=viewAst,cc=Mv?ss(Mv.wm,0,1):0,gg=Gv?ss(Gv.wg,0,1):0,dd=Av?ss(Av.wa,0,1):0;
const T12=new THREE.Vector3().copy(Sv.pos).multiplyScalar(1-bb).addScaledVector(Pv.pos,bb);
const T3=Mv?T12.clone().multiplyScalar(1-cc).addScaledVector(Mv.pos,cc):T12;
const T35=Gv?T3.clone().multiplyScalar(1-gg).addScaledVector(Gv.pos,gg):T3;
const T4=Av?T35.clone().multiplyScalar(1-dd).addScaledVector(Av.pos,dd):T35;
const Tdes=new THREE.Vector3().copy(g.c).multiplyScalar(1-a).addScaledVector(T4,a);
const lw=lerp(lerp(lerp(lerp(Math.log(sysW(Sv)),Math.log(W2),bb),Math.log(W3),cc),Math.log(Wg),gg),Math.log(W4),dd);
const wdes=Math.exp(lerp(Math.log(g.w),lw,a));
const fE=o=>Math.log(Math.max(1,o/345)),lfP=Pv?fE(Pv.mL.e.ext):0,lfM=Mv?fE((Mv.gL||Mv.aL||{e:{ext:0}}).e.ext):0,lfG=Gv?fE(Gv.aL.e.ext):0,lfA=Av?fE(Av.G?Av.G.aL.e.ext:(Av.M.aL||{e:{ext:0}}).e.ext):0;
fitCur=Math.exp(lerp(lerp(lerp(lerp(0,lfP,bb),lfM,cc),lfG,gg),lfA,dd));
 if(!clock&&!Tcur.lengthSq()&&first){Tcur.copy(Tdes);wppCur=wdes;first=false}
 Tcur.lerp(Tdes,k(4.2));wppCur+= (wdes-wppCur)*k(4.2);if(inst){Tcur.copy(Tdes);wppCur=wdes}
 const kd=k(9);yaw+=(yawT-yaw)*kd;pitch+=(pitchT-pitch)*kd;zf+=(zfT-zf)*k(7);pan.lerp(panT,kd);
 const wR=wppCur,wC=wppCur*zf,D=wC*H/(2*TANH),cp=Math.cos(pitch),sp=Math.sin(pitch),tL=Tcur.clone().add(pan);
 // shift system left of centre when the left card is up, and left again when the skill panel is open
 const ox=(level>=1?85:0)-(drawerOpen()?170:0),oy=level===0?-24:0;
 camera.up.set(0,1,0);camera.position.set(tL.x+D*Math.sin(yaw)*cp,tL.y+D*sp,tL.z+D*Math.cos(yaw)*cp);camPos.copy(camera.position);camera.lookAt(tL);camera.updateMatrixWorld(true);
 camera.getWorldDirection(fwd);right.setFromMatrixColumn(camera.matrixWorld,0);
 if(ox||oy){const up=tmp.setFromMatrixColumn(camera.matrixWorld,1).clone(),shv=right.clone().multiplyScalar(-ox*wC).addScaledVector(up,-oy*wC);camera.position.add(shv);camera.lookAt(tL.clone().add(shv));camera.updateMatrixWorld(true);camPos.copy(camera.position);camera.getWorldDirection(fwd);right.setFromMatrixColumn(camera.matrixWorld,0)}
 const t=now/1000;
 {const mv=camera.position.distanceTo(prevCP)/Math.max(D,1)>2e-4||camera.quaternion.angleTo(prevCQ)>2e-4||dragging;if(mv||lastCam==null)lastCam=now;prevCP.copy(camera.position);prevCQ.copy(camera.quaternion);
  const tg=RM()?0:(now-lastCam>1500?1:0);flareG=inst?tg:(tg>flareG?Math.min(tg,flareG+dt/.6):Math.max(tg,flareG-dt/.2))}
 // per-system update
 sysList.forEach(S=>{
  const aS=1-clamp(lv,0,1)*(1-S.ws),wpm=S.planets.reduce((m,P)=>Math.max(m,P.wp),0),starA=aS*(1-bf*S.ws)*(1-fo(wpm)),n=S.y.n;
  S.alpha=aS;
  const wX=Math.min(wR,Math.exp(lerp(Math.log(S.y.wgd),Math.log(S.y.w1),a)))/fitCur;
  const sPx=lerp(S0(S.u),S1(S.u),a),w=wppAt(S.pos),sApp=sPx*wX/w;
  S.mesh.visible=starA>.01;S.glow.visible=starA>.01;S.cor.visible=starA>.01;
  S.mesh.position.copy(S.pos);S.mesh.scale.setScalar(sPx*wX);S.mesh.material.uniforms.uAlpha.value=starA;dw(S.mesh.material,starA);S.b.wr=sPx*wX;S.mesh.material.uniforms.uTime.value=RM()?0:t;
  S.glow.position.copy(S.pos);S.glow.scale.setScalar(sPx*wX*(S.started?5.2:3.6));S.glow.material.opacity=.6*starA*(S.started?1:.5);
  S.cor.position.copy(S.pos);S.cor.quaternion.copy(camera.quaternion);S.cor.scale.setScalar(sPx*wX*2.6);{const u=S.cor.material.uniforms;u.uAlpha.value=starA*(S.started?1:.55);u.uTime.value=RM()?0:t;u.uFlare.value=RM()?0:flareG}
  projectTo(S.b,S.pos);S.b.px=sApp;S.b.alpha=starA;S.b.dep=w;S.b.pos.copy(S.pos);
  S.hitR=lv<.6?Math.max(sApp+14,(S.y.Rmax/w)*.55+10):sApp+8;
  S.planets.forEach(P=>{
   const p=P.p,nm=p.moons.length,wp=P.wp;
   const sibP=1-bf*(1-Math.max(wp,P.tp)),wpe=ex(wp),pA=aS*sibP*(1-fo(P.wcm))*ss(S.ws,.7,.95);
   const px0=lerp(P0(P.u),P1(P.u),a),px=lerp(px0,P2,wpe),wP=wppAt(P.pos);
   P.alpha=pA;setOrb(P.orb,S.pos,p.R,P.q,S.ws>.02?S.ws*aS*(1-bf):0,P.pos,px*wX);
   P.mesh.visible=pA>.01;P.mesh.position.copy(P.pos);P.mesh.scale.setScalar(px*wX);P.mesh.rotation.y=P.th0+Pp*.35;P.mesh.material.uniforms.uAlpha.value=pA;dw(P.mesh.material,pA);P.b.wr=px*wX;P.mesh.material.uniforms.uTime.value=t;
   projectTo(P.b,P.pos);P.b.px=px*wX/wP;P.b.alpha=pA;P.b.dep=wP;P.b.pos.copy(P.pos);
   // moons
   const mvB=S.ws*sibP*ss(wp,.35,.6);
   P.moonsVis=mvB>.01;
   P.moons.forEach(M=>{
    const m=M.m,sk=!!m.skill;
    if(!P.moonsVis){M.mesh.visible=false;M.b.alpha=0;M.alpha=0;M.asts.forEach(A=>{A.b.alpha=0;A.alpha=0;if(A.mesh)A.mesh.visible=false});M.groups.forEach(G=>{G.b.alpha=0;G.alpha=0;G.mesh.visible=false});return}
    const wme=ex(M.wm),sibM=1-fo(P.wcm)*(1-M.wm),mvis=mvB*sibM*(1-fo(M.wam)),mpx=lerp(lerp(M1(M.u,sk),M2(M.u,sk),wpe),MV,wme),wpp=wX;
    const sl=P.mL.c.slot[m.j],rm=P.mR[sl.k],orb=lerp(P.mL.c.rings[sl.k].R,P.mL.e.rings[sl.k].R,wpe),ang=rm.th0+Pm*2*Math.PI/rm.T+2*Math.PI*sl.a/sl.n,R=orb*wpp;
    M.pos.copy(P.pos).add(v3.set(Math.cos(ang),0,Math.sin(ang)).applyQuaternion(rm.q).multiplyScalar(R));
    M.mesh.geometry=M.wm>.04?SPH:SPHL;M.alpha=mvis;M.mesh.visible=mvis>.01;M.mesh.position.copy(M.pos);M.mesh.scale.setScalar(mpx*wX);M.mesh.rotation.y=ang*2;M.mesh.material.uniforms.uAlpha.value=mvis;dw(M.mesh.material,mvis);M.b.wr=mpx*wX;M.mesh.material.uniforms.uTime.value=t;
    setOrb(P.mO[sl.k],P.pos,R,rm.q,mvis*ss(lv,.7,1.2)*(1-fo(P.wcm))*P.wp,M.pos,mpx*wX);
    projectTo(M.b,M.pos);M.b.px=mpx*wX/wppAt(M.pos);M.b.alpha=mvis;M.b.dep=wpp;M.b.pos.copy(M.pos);
    const avis=ss(M.wm,.4,.9);
    /* groups (course bands) orbit the moon; they play the moonlet role in the planet view */
    M.groups.forEach(G=>{
     const wge=ex(G.wg),sg=M.gL.c.slot[G.j],rg=M.gR[sg.k];
     G.px=lerp(lerp(gpx0(G.u),gpx3(G.u),wme),GV,wge);
     const Rg=lerp(M.gL.c.rings[sg.k].R,M.gL.e.rings[sg.k].R,wme)*wX,ga=rg.th0+Pa*2*Math.PI/rg.T+2*Math.PI*sg.a/sg.n;
     G.pos.copy(M.pos).add(v3.set(Math.cos(ga),0,Math.sin(ga)).applyQuaternion(rg.q).multiplyScalar(Rg));
     const gv=avis*ss(sibM,.55,1)*(1-fo(M.wgx)*(1-Math.max(G.wg,G.tg)))*(1-fo(G.wam));G.alpha=gv;setOrb(M.gO[sg.k],M.pos,Rg,rg.q,gv*mvis*M.wm*(1-fo(M.wgx)),G.pos,G.px*wX);
     if(gv<.01){G.b.alpha=0;G.mesh.visible=false;return}
     G.mesh.geometry=G.px>22?SPH:SPHL;G.mesh.visible=true;G.mesh.position.copy(G.pos);G.mesh.scale.setScalar(G.px*wX);G.mesh.rotation.y=ga*2;G.mesh.material.uniforms.uAlpha.value=gv;dw(G.mesh.material,gv);G.b.wr=G.px*wX;G.mesh.material.uniforms.uTime.value=t;
     projectTo(G.b,G.pos);G.b.px=G.px*wX/wppAt(G.pos);G.b.alpha=gv;G.b.dep=1;G.b.pos.copy(G.pos)});
    M.asts.forEach(A=>{
     const G=A.G;let av,apx,cen,L,Rr,idx,w;
     if(G){av=M.wm*ss(G.wg,.4,.9)*(1-fo(M.wax)*(1-Math.max(A.wa,A.ta)));cen=G.pos;L=G.aL;Rr=G.aR;idx=A.gk;w=ex(G.wg)}
     else{av=avis*ss(sibM,.55,1)*(1-fo(M.wam)*(1-Math.max(A.wa,A.ta)));cen=M.pos;L=M.aL;Rr=M.aR;idx=A.k;w=wme}
     apx=lerp(lerp(apxC(A.u),apxE(A.u),w),86,ex(A.wa));
     const sa=L.c.slot[idx],ra=Rr[sa.k],Ra=lerp(L.c.rings[sa.k].R,L.e.rings[sa.k].R,w)*wX,aa=ra.th0+Pa*2*Math.PI/ra.T+2*Math.PI*sa.a/sa.n;
     A.pos.copy(cen).add(v3.set(Math.cos(aa),0,Math.sin(aa)).applyQuaternion(ra.q).multiplyScalar(Ra));setOrb((G?G.aO:M.aO)[sa.k],cen,Ra,ra.q,av*.85*(G?G.wg*(1-fo(G.wam)):M.wm*(1-fo(M.wam))),A.pos,apx*wX);if(av<.01){A.b.alpha=0;A.alpha=0;if(A.mesh)A.mesh.visible=false;return}
     const mesh=astMesh(A);A.pos.copy(cen).add(v3.set(Math.cos(aa),0,Math.sin(aa)).applyQuaternion(ra.q).multiplyScalar(Ra));A.alpha=av;mesh.visible=true;mesh.position.copy(A.pos);
     const sz=apx*wX;mesh.scale.setScalar(sz);mesh.rotation.y=aa*2;{const U=mesh.material.uniforms;U.uAlpha.value=av;U.uTime.value=t}dw(mesh.material,av);A.b.wr=sz;
     projectTo(A.b,A.pos);A.b.px=apx*wX/wppAt(A.pos);A.b.alpha=av;A.b.dep=1;A.b.pos.copy(A.pos)})})
  })});
 shadowPass();
 {const c=bodies.filter(b=>b.ok&&b.alpha>.06&&b.px>.5).map(b=>({x:b.sx-W/2,y:H/2-b.sy,r:Math.max(b.px,b.tr||0)*clamp(b.alpha*2,.4,1)+3})).sort((a,b)=>b.r-a.r).slice(0,ORBMAX);c.forEach((d,i)=>ORBU.uD.value[i].set(d.x,d.y,d.r));ORBU.uN.value=c.length}
 ORBITS.forEach(o=>{const v=ORB&&o.al>.02;o.mesh.visible=v;if(!v)return;const U=o.mesh.material.uniforms;o.mesh.position.copy(o.pos);o.mesh.quaternion.copy(o.q);o.mesh.scale.setScalar(o.R);U.uA.value=o.a0*clamp(o.al,0,1);U.uRes.value.set(W,H)});
 overlay(wL2,a);
}
let first=true,lastCam=null,flareG=0;const prevCP=new THREE.Vector3(),prevCQ=new THREE.Quaternion();

/* ---------- overlay: rings, labels, hit areas, feeds ---------- */
function onscreen(b){return b.ok&&b.sx>-40&&b.sx<W+40&&b.sy>-40&&b.sy<H+40}
let fr=0;const BK={star:[],planet:[],moon:[],group:[],ast:[]},LAY={star:{g:gS},planet:{g:gP},moon:{g:gM},group:{g:gG},ast:{g:gA}};bodies.forEach(b=>BK[b.kind].push(b));
/* is the body's centre hidden behind a nearer, mostly opaque sphere? (ray-sphere test from the camera) */
function occlusion(){const cands=bodies.filter(b=>b.vis&&b.alpha>.5&&b.wr);
 bodies.forEach(b=>{b.occ=false;if(!b.vis||b.alpha<.015)return;tmp.copy(b.pos).sub(camPos);const Lb=tmp.length();if(Lb<1)return;const dx=tmp.x/Lb,dy=tmp.y/Lb,dz=tmp.z/Lb;
  for(const c of cands){if(c===b)continue;const cx=c.pos.x-camPos.x,cy=c.pos.y-camPos.y,cz=c.pos.z-camPos.z,tc=cx*dx+cy*dy+cz*dz;
   if(tc<=0||tc>=Lb-(b.wr||0)*.3)continue;const d2=cx*cx+cy*cy+cz*cz-tc*tc,R=c.wr*.97;if(d2<R*R){b.occ=true;break}}})}
const FOCAL=()=>H/(2*TANH);
function viewPrep(){camUp.setFromMatrixColumn(camera.matrixWorld,1);const F=FOCAL();
 bodies.forEach(b=>{if(b.alpha<.015||!b.wr){b.cz=0;return}tmp.copy(b.pos).sub(camPos);const x=tmp.dot(right),y=tmp.dot(camUp),z=tmp.dot(fwd);b.cvx=x;b.cvy=y;b.cz=z;
  b.tr=z>1?Math.max(b.px,F*b.wr*(x*x+y*y+z*z)/(z*z*z)):b.px})}
/* ---------- in-scene labels: canvas-texture planes at a real 3-D point (the body's view depth minus its own radius, so the body never hides its own label), constant on-screen size, depth-tested against every body and never depth-written, rendered after the bodies. Whatever part of a label lies behind a nearer body is hidden pixel by pixel; the part in front is fully drawn. ---------- */
const LDPR=Math.min(window.devicePixelRatio||1,2),LGEO=new THREE.PlaneGeometry(1,1),LCV=document.createElement('canvas').getContext('2d');
const LSTY={star:[15,700,11.5,150],planet:[12.5,650,10.5,112],moon:[10.5,600,10,92],group:[10.5,600,10,92],ast:[10,600,10,84]};let LFAM=null;
function wrapLines(txt,font,maxW){LCV.font=font;const ws=txt.split(/\s+/).filter(Boolean);if(!ws.length)return[''];const mw=t=>LCV.measureText(t).width;
 const greedy=W=>{const L=[];let c='';for(const w of ws){const t=c?c+' '+w:w;if(c&&mw(t)>W){L.push(c);c=w}else c=t}L.push(c);return L};
 const longest=Math.max(...ws.map(mw)),total=mw(ws.join(' '));
 for(let n=1;n<=3;n++){let lo=longest,hi=Math.max(total,longest);for(let i=0;i<14;i++){const m=(lo+hi)/2;if(greedy(m).length<=n)hi=m;else lo=m}
  if(hi<=maxW||n===3)return greedy(hi+.5)}}
function labelTex(b,sub){const k=b.kind,[fs,fw,fs2,maxW]=LSTY[k];if(!LFAM)LFAM='system-ui,-apple-system,"Segoe UI",sans-serif';
 const t1=b.t1.textContent,t2=b.t2.textContent,sig=t1+'|'+t2+'|'+sub+'|'+LDPR;b.ltc=b.ltc||[];const slot=sub?1:0;let e=b.ltc[slot];if(e&&e.sig===sig)return e;
 if(e)e.tex.dispose();
 const f1=fw+' '+fs+'px '+LFAM,f2='400 '+fs2+'px '+LFAM,L1=wrapLines(t1,f1,maxW),useSub=sub&&L1.length<=2&&t2,lh=Math.round(fs*1.18),lh2=Math.round(fs2*1.18),pad=4;
 LCV.font=f1;let w=Math.max(...L1.map(t=>LCV.measureText(t).width));if(useSub){LCV.font=f2;w=Math.max(w,LCV.measureText(t2).width)}
 w=Math.ceil((w+2*pad)*LDPR)/LDPR;const h=Math.ceil((L1.length*lh+(useSub?lh2:0)+2*pad)*LDPR)/LDPR;
 const cv=document.createElement('canvas');cv.width=Math.ceil(w*LDPR);cv.height=Math.ceil(h*LDPR);const c=cv.getContext('2d');c.scale(LDPR,LDPR);c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
 const put=(t,y,f,sw,fill)=>{c.font=f;c.lineWidth=sw;c.strokeStyle='#05070b';c.strokeText(t,w/2,y);c.fillStyle=fill;c.fillText(t,w/2,y)};
 L1.forEach((t,i)=>put(t,pad+(i+.5)*lh,f1,4,'#e6edf3'));if(useSub)put(t2,pad+L1.length*lh+lh2/2,f2,3.5,'#9aa7b4');
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.generateMipmaps=false;tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
 e=b.ltc[slot]={sig,tex,w,h};return e}
function placeLabel(b,lt,cx,ty,fa){let m=b.lm;if(!m){m=b.lm=new THREE.Mesh(LGEO,new THREE.MeshBasicMaterial({transparent:true,depthTest:true,depthWrite:false,toneMapped:false}));m.frustumCulled=false;m.renderOrder=5;scene.add(m)}
 if(m.material.map!==lt.tex){m.material.map=lt.tex;m.material.needsUpdate=true}m.material.opacity=clamp(fa,0,1);
 const tlx=Math.round((cx-lt.w/2)*LDPR)/LDPR,tly=Math.round(ty*LDPR)/LDPR,ccx=tlx+lt.w/2,ccy=tly+lt.h/2,zl=Math.max(b.cz-(b.wr||0),camera.near*2),t=zl/FOCAL();
 m.position.copy(camPos).addScaledVector(fwd,zl).addScaledVector(right,(ccx-W/2)*t).addScaledVector(camUp,-(ccy-H/2)*t);m.quaternion.copy(camera.quaternion);m.scale.set(lt.w*t,lt.h*t,1);m.visible=true}
function overlay(wL2,a){
 viewPrep();occlusion();const labs=[];const selB=selSkill&&byRef.get(SG.by[selSkill]);
 bodies.forEach(b=>{
  const al=b.alpha,k=b.kind;let vis=al>.015&&onscreen(b);
  if(k==='star'&&b.sys.alpha<.01)vis=false;
  if(!vis){if(b.lm)b.lm.visible=false;if(b.rings)b.rings.mesh.visible=false;if(b.vis){b.g.style.display='none';b.vis=false;b.hit=false}return}
  if(!b.vis){b.g.style.display='';b.vis=true}
  b.g.setAttribute('transform','translate('+b.sx.toFixed(1)+' '+b.sy.toFixed(1)+')');b.g.style.opacity=al.toFixed(2);
  // interactivity
  let hit=false,hr=b.px+6;
  if(k==='star'){hit=al>.4&&level<2;hr=b.sys.hitR}
  else if(k==='planet'){hit=al>.4&&lv>.6&&!(b.P.wp>.5&&level>=2);hr=Math.max(11,b.px+7)}
  else if(k==='moon'){hit=al>.4&&lv>.7&&(level===1||(level===2&&b.M.P.wp>.5));hr=Math.max(8,b.px+4)}
  else if(k==='group'){hit=al>.4&&((level===2&&lv>1.6)||level===3);hr=Math.max(7,b.px+4)}
  else{const A=b.A;hit=al>.55&&(A.G?(level===3||(level===4&&!selAst)):(level===2||level===3));hr=Math.max(6.5,b.px+3)}
  b.hr=hr;b.hitC.setAttribute('r',hr.toFixed(1));b.fr.setAttribute('r',(k==='ast'?hr+1:b.px+(b.rings?13:4)).toFixed(1));
  if(hit!==b.hit){b.hit=hit;b.g.setAttribute('data-hit',hit?'1':'0');b.g.setAttribute('tabindex',hit?'0':'-1');b.g.setAttribute('aria-hidden',hit?'false':'true')}
  // rings
  if(b.rings){const w=k==='star'?2.2:k==='planet'?1.4:k==='group'?.5+.9*b.G.M.wm:.4+1.2*b.M.wm;setRings(b,b.stats,b.px,w,b.px>=(k==='moon'?4.6:k==='group'?5.5:6.5),al)}
  // labels
  let la=0,pri=9;
  /* r16 label focus rule (same as the rings): a body is labelled only if it is the focused body or a direct child of it; every weight is a smooth blend so labels fade on level change */
  if(k==='star'){la=al*(1-wL2);pri=1;}
  else if(k==='planet'){const P=b.P;la=al*Math.max(P.S.ws*(1-wL2),P.wp*(1-fo(P.wcm)));pri=P.wp>.5?0:2}
  else if(k==='moon'){const M=b.M,P=M.P;la=al*Math.max(P.wp*(1-fo(P.wcm)),M.wm*(1-fo(M.wam)));pri=M.wm>.5?0:3}
  else if(k==='group'){const G=b.G,M=G.M;la=al*Math.max(M.wm*(1-fo(M.wam)),G.wg*(1-fo(G.wam)));pri=G.wg>.5?0:1}
  else{const A=b.A,G=A.G,M=A.M,sel=selSkill===b.id;la=al*Math.max(G?G.wg*(1-fo(G.wam)):M.wm*(1-fo(M.wam)),A.wa);pri=sel?0:(G?2:1)}
  b.lalpha=la;
  const show=la>.05&&LAB&&b.cz>1;b.t1.style.display=show?'':'none';
  if(show){const ins=k==='star'?ss(lv,.35,.85):0,subOn=k!=='ast'&&(k==='star'||k==='planet'||pri===0)&&!(k==='star'&&ins>.5),lt=labelTex(b,subOn),r=b.px+(b.rings?(k==='star'?13:9):4)+(k==='ast'?3:0);
   labs.push({b,lt,x:b.sx,y:lerp(b.sy+r+2,b.sy-lt.h/2,ins),w:lt.w,h:lt.h,r,fa:la,pri:(hover===b||selB===b)?-1:pri})}
  else if(b.lm)b.lm.visible=false});
 // depth order inside each layer so the nearer body is on top and gets the click
 if((fr++&7)===0)for(const kd in LAY){const L=LAY[kd],vis=BK[kd].filter(b=>b.vis).sort((p,q)=>q.zd-p.zd),key=vis.map(b=>b.id).join('|');if(key!==L.key){L.key=key;vis.forEach(b=>L.g.appendChild(b.g))}}
 // greedy collision cull
 labs.sort((p,q)=>p.pri-q.pri||q.b.px-p.b.px);const placed=[];
 const clash=(x,y,l)=>{let n=0;for(const q of placed)if(Math.abs(x-q.x)*2<l.w+q.w&&y<q.y+q.h&&q.y<y+l.h)n++;return n};
 labs.forEach(l=>{let bx=0,by=0;
  if(clash(l.x,l.y,l)&&l.pri>=0){const h=l.h,sd=l.w*.5+8,up=-(2*l.r+6+h),C=[[0,h],[0,2*h],[0,up],[0,up-h],[sd,0],[-sd,0],[sd,h],[-sd,h],[0,3*h],[0,up-2*h],[sd,up],[-sd,up],[sd,2*h],[-sd,2*h],[0,4*h],[0,up-3*h]];let best=1e9;
   for(const [dx,dy] of C){const n=clash(l.x+dx,l.y+dy,l);if(n<best){best=n;bx=dx;by=dy;if(!n)break}}}
  placed.push({x:l.x+bx,y:l.y+by,w:l.w,h:l.h});placeLabel(l.b,l.lt,l.x+bx,l.y+by,l.fa)});

 // feeds: ribbon child->parent in 3-D, bright segment travels child->parent
 const motion=!RM();
 feeds.forEach(f=>{
  const A=f.a,B=f.b;let al=Math.min(A.alpha,B.alpha);
  /* r19: feeds follow the same focus rule as rings and labels: only the focused body's children get a line to it */
  {const q=A.kind;al*=q==='planet'?A.P.S.ws*(1-wL2):q==='moon'?A.M.P.wp*(1-fo(A.M.P.wcm)):q==='group'?A.G.M.wm*(1-fo(A.G.M.wam)):(A.A.G?A.A.G.wg*(1-fo(A.A.G.wam)):A.A.M.wm*(1-fo(A.A.M.wam)))}
  const hide=()=>{if(f.vis){f.mesh.visible=false;f.vis=false}};
  const ok=LNS&&al>.03&&A.ok&&B.ok&&A.vd>2&&B.vd>2;
  if(!ok)return hide();
  const dx=B.sx-A.sx,dy=B.sy-A.sy,len=Math.hypot(dx,dy);
  const ra=Math.max(A.tr||0,A.px)+.5,rb=Math.max(B.tr||0,B.px)+.5,L=len-ra-rb;
  if(L<2.5)return hide();
  f.vis=true;f.mesh.visible=true;
  const s0=ra/len,s1=1-rb/len,tf=sg=>(sg/B.vd)/((1-sg)/A.vd+sg/B.vd),u=f.mesh.material.uniforms;
  u.uA.value.copy(A.pos).lerp(B.pos,tf(s0));u.uB.value.copy(A.pos).lerp(B.pos,tf(s1));u.uRes.value.set(W,H);
  const ea=Math.min(1,al*1.25)*ss(L,2.5,6),ux=dx/len,uy=dy/len,x0=A.sx+ux*ra,y0=A.sy+uy*ra,x1=B.sx-ux*rb,y1=B.sy-uy*rb;
  const seg=f.st===1?Math.max(8,lerp(10,L*.96,Math.pow(f.pr,1.6))):28,sp=(f.kind==='ast'?13:24)*lerp(.3,2.6,.4*f.pr+.6*f.pr*f.pr);
  if(motion&&f.st===1)f.ph=(f.ph+dtS*sp/(L+seg))%1;/* monotonic: only ever increases, line runs child->parent so the pulse always flows inward */
  const ph=motion?f.ph:.58,hd=ph*(L+seg),tl=hd-seg,a0=clamp(tl,0,L),a1=clamp(hd,0,L),vs=Math.max(0,a1-a0)/seg;
  u.uEa.value=ea;u.uHead.value=hd;u.uSeg.value=seg;u.uBc.value=a1;u.uBrx.value=7+6*f.pr;u.uT.value=motion?(performance.now()/1000)%2000:0;
  if(f.st===2){const wl=Math.max(A.pos.distanceTo(B.pos),1e-3),K=len/wl,pxW=2.4*K,eff=clamp(Math.max(f.fw,pxW),f.fw,140);u.uK.value=K;u.uFw.value=eff;u.uHW.value=eff*1.5+4.5;u.uLod.value=ss(pxW,4,10)}u.uBry.value=f.fw*1.5+2.5;u.uBo.value=(f.st!==1||hd<=0||hd>=L+6)?0:ea*clamp(hd/6,0,1)*clamp((L+6-hd)/6,0,1);
  const t0=tl/L,t1=hd/L;f.tail=[x0+(x1-x0)*t0,y0+(y1-y0)*t0];f.head=[x0+(x1-x0)*t1,y0+(y1-y0)*t1]})
}

/* ---------- navigation ---------- */
function say(t){live.textContent=t}
function crumb(){const p=[{t:'Galaxy',fn:level?goGalaxy:null}];
 if(fSys){p.push({t:fSys.y.name,fn:level>=2?()=>goStar(fSys):null});
  if(fPlanet){p.push({t:fPlanet.p.name,fn:level>=3?()=>goPlanet(fPlanet):null});
   if(selMoonM){const deep=!!(selGroup||selAst);p.push({t:selMoonM.m.name,fn:deep?()=>goMoon(selMoonM):null});
    if(selGroup){p.push({t:selGroup.g.name,fn:selAst?()=>goGroup(selGroup):null})}
    if(selAst)p.push({t:selAst.s.name})}}}
 UI.setCrumb(p);
 const gm=selMoonM&&selMoonM.groups.length;
 UI.hint.textContent=level===0?'Galaxy: stars and their planets · click a star to fly in · scroll out or Esc goes back'
  :level===1?'Star: planets orbit it · click a planet to zoom in (its moons appear) · inner planets are more fundamental'
  :level===2?'Planet: moons are topics · click a moon to zoom in (its moonlets appear) · Esc goes back'
  :selAst?'Skill: detail on the right · Esc goes back'
  :selGroup?'Group: its skills orbit it · click a skill to open it · Esc goes back to the moon'
  :gm?'Moon: course-band groups orbit it, their skills orbit them · click a group to zoom in · Esc goes back'
  :'Moon: moonlets are skills · click a moonlet to zoom in and open it · Esc goes back'}
function clearSel(){zfT=1;panT.set(0,0,0);if(selSkill){selSkill=null;UI.draw.classList.remove('open');drawer.hide();UI.shift(false)}byRef.forEach(b=>b.g.classList.remove('sel'))}
function openSkill(id){const s=SG.by[id];selSkill=id;drawer.show(s);{const ch=UI.draw.querySelector('.sg-chip');if(ch)ch.insertAdjacentHTML('afterend','<div class="sgs-hrs"><b>Est. time to master: ~'+fmtH(s.hrs)+'</b> <span class="mut sm">placeholder estimate from course band, skill type and prerequisites</span></div>')}UI.draw.classList.add('open');UI.shift(true);const bb=byRef.get(s);bb&&bb.g.classList.add('sel')}
function goGalaxy(){level=0;if(fSys)viewSys=fSys;fSys=fPlanet=selMoonM=selAst=selGroup=null;selMoon=null;clearSel();setHud();crumb();say('Galaxy')}
function goStar(S){level=1;fSys=S;viewSys=S;if(fPlanet)viewPlanet=fPlanet;fPlanet=selMoonM=selAst=selGroup=null;selMoon=null;clearSel();setHud();crumb();say(S.y.name+' star: '+S.y.n+' domains')}
function goPlanet(P){level=2;fSys=P.S;viewSys=P.S;fPlanet=P;viewPlanet=P;selMoonM=selAst=selGroup=null;selMoon=null;clearSel();setHud();crumb();say(P.p.name+' planet: '+P.p.moons.length+' topics')}
function goMoon(M){level=3;const P=M.P;fSys=P.S;viewSys=P.S;fPlanet=P;viewPlanet=P;selMoonM=M;viewMoon=M;selAst=null;selGroup=null;selMoon=M.m;clearSel();if(M.m.skill)openSkill(M.m.skill.id);setHud();crumb();say(M.m.name+(M.m.skill?', '+SG.statusText(M.m.skill):' topic: '+M.m.skills.length+' skills'+(M.groups.length?' in '+M.groups.length+' course-band groups':'')))}
function goGroup(G){level=4;const M=G.M,P=M.P;fSys=P.S;viewSys=P.S;fPlanet=P;viewPlanet=P;selMoonM=M;viewMoon=M;selGroup=G;viewGroup=G;selAst=null;selMoon=M.m;clearSel();setHud();crumb();say(G.g.name+' group of '+M.m.name+': '+G.n+' skills')}
function goAst(A){const M=A.M,P=M.P;level=A.G?5:4;fSys=P.S;viewSys=P.S;fPlanet=P;viewPlanet=P;selMoonM=M;viewMoon=M;selGroup=A.G||null;if(A.G)viewGroup=A.G;selAst=A;viewAst=A;selMoon=M.m;clearSel();openSkill(A.s.id);setHud();crumb();say(A.s.name+', '+SG.statusText(A.s))}
function up(){if(selAst){selAst.G?goGroup(selAst.G):goMoon(selMoonM)}else if(selGroup)goMoon(selMoonM);else if(level===3)goPlanet(fPlanet);else if(level===2)goStar(fSys);else if(level===1)goGalaxy()}
const drawer=SG.mountDrawer(UI.draw,{mode:()=>'tier',onClose:()=>{if(selSkill)up()},onGo:id=>selectSkill(id)});
function selectSkill(id){const loc=SOL.skillLoc[id];if(!loc)return;const M=MO[loc.moon.id];if(!M)return;const A=AST[id];if(A)goAst(A);else goMoon(M)}
function selectMoon(M){goMoon(M)}
function activate(b){if(!b||!b.hit)return;
 if(b.kind==='star')goStar(b.sys);
 else if(b.kind==='planet')goPlanet(b.P);
 else if(b.kind==='moon')goMoon(b.M);
 else if(b.kind==='group')level===3?goGroup(b.G):goMoon(b.G.M);
 else if(b.A.G)level===4?goAst(b.A):goGroup(b.A.G);
 else level===3?goAst(b.A):goMoon(b.A.M)}

/* ---------- left card ---------- */
function bar(l,v,c){return v==null?'':'<div class="br"><span>'+l+'</span><div class="bar"><i style="width:'+pct(v)+'%;background:'+c+'"></i></div><b>'+pct(v)+'%</b></div>'}
function layerBars(st){return '<div class="bars">'+bar('Solid or better',st.share,'#58a6ff')+bar('Explain it',st.uv,DIMS[0].c)+bar('Do it fast',st.fv,DIMS[1].c)+bar('Use it anywhere',st.tv,DIMS[2].c)+bar('Stays fresh',st.frv,'#c9d1d9')+'</div>'}
function liveList(items){return items.length?'<div class="live"><i></i><b>Learning now:</b> '+items.slice(0,5).join(', ')+(items.length>5?' +'+(items.length-5)+' more':'')+'</div>':'<div class="live" style="color:var(--mut)">Nothing in progress here.</div>'}
function setHud(){
 if(level===0){hud.hidden=true;return}hud.hidden=false;const S=fSys;let h='';
 if(level===1){const y=S.y,st=y.stats;
  h='<h2>'+y.name+'</h2><div class="sub">Star · '+y.n+' domains = '+y.n+' planets</div><div class="kv"><span>Topics (moons)</span><b>'+y.planets.reduce((a,p)=>a+p.moons.length,0)+'</b></div><div class="kv"><span>Skills</span><b>'+y.skills.length+'</b></div>'+layerBars(st)+
  liveList(y.planets.filter(p=>p.stats.on).map(p=>p.short))+'<div class="sub" style="margin-top:8px">Orbit order: inner planets are more fundamental. Pulses show learning feeding the star.</div>'+(y.note?'<div class="sub">'+y.note+'</div>':'')}
 else if(level===2){const p=fPlanet.p,st=p.stats;
  h='<h2>'+p.name+'</h2><div class="sub">Planet '+(p.i+1)+' of '+p.sys.n+' from '+S.y.name+' · '+p.moons.length+' '+(S.y.hasAsts?'topics':'skills')+' · '+p.skills.length+' skills</div>'+layerBars(p.stats)+liveList(p.moons.filter(x=>x.stats.on).map(x=>x.name))}
 else if(selGroup){const G=selGroup,g=G.g,m=selMoonM.m,p=fPlanet.p;
  h='<h2>'+g.name+'</h2><div class="sub">Course-band group of '+m.name+' · '+p.name+' · '+g.n+' skills</div>'+layerBars(g.stats)+
  liveList(g.skills.filter(s=>{const k=SG.knowOf(s);return k>=SOL.ACTIVE_LO&&k<SOL.ACTIVE_HI}).map(s=>s.name))+(selAst?'<div class="live" style="border-top-color:'+p.hue+'"><b>'+selAst.s.name+'</b><br><span class="sub">'+SG.statusText(selAst.s)+'</span></div>':'')}
 else{const m=selMoonM.m,p=fPlanet.p;
  h='<h2>'+m.name+'</h2><div class="sub">'+(m.skill?'Skill':'Topic')+' (moon) of '+p.name+' · '+m.skills.length+' '+(m.skill?'skill':'skills')+(m.groups?' · '+m.groups.length+' course-band groups':'')+'</div>'+layerBars(m.stats)+
  liveList((m.groups?m.groups.filter(g=>g.stats.on).map(g=>g.name+' (group)'):[]).concat(m.asts.filter(s=>{const k=SG.knowOf(s);return k>=SOL.ACTIVE_LO&&k<SOL.ACTIVE_HI}).map(s=>s.name)))+(selAst?'<div class="live" style="border-top-color:'+p.hue+'"><b>'+selAst.s.name+'</b><br><span class="sub">'+SG.statusText(selAst.s)+'</span></div>':'')}
 const hb=selAst?selAst.b.hrs:selGroup?selGroup.b.hrs:selMoonM?selMoonM.b.hrs:fPlanet?fPlanet.b.hrs:S.b.hrs;
 h+='<div class="kv" style="margin-top:7px"><span>Est. time to master</span><b>~'+fmtH(hb)+'</b></div><div class="sub">Placeholder estimate (see Legend)</div>';
 hud.innerHTML=h}
function counts(){const r={star:0,planet:0,moon:0,group:0,ast:0,feeds:0};bodies.forEach(b=>{if(b.vis&&b.alpha>.3)r[b.kind]++});feeds.forEach(f=>{if(f.vis)r.feeds++});r.total=r.star+r.planet+r.moon+r.group+r.ast;return r}

/* ---------- input ---------- */
/* hover + click use a ray from the camera through the pointer against the bodies' (padded) spheres; the nearest one along the ray wins, so a body in front always beats one behind it */
const rd=new THREE.Vector3(),rc=new THREE.Vector3();
function pick(cx,cy){const r=stage.getBoundingClientRect();rd.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1,.5).unproject(camera).sub(camera.position).normalize();
 let best=null,bt=1e12;
 for(const b of bodies){if(!b.hit||!b.vis||b.occ)continue;rc.copy(b.pos).sub(camera.position);const tc=rc.dot(rd);if(tc<=0)continue;
  const R=(b.hr||8)*wppAt(b.pos),d2=rc.lengthSq()-tc*tc;if(d2>R*R)continue;const t=tc-Math.sqrt(R*R-d2);if(t<bt){bt=t;best=b}}
 return best}
let ptrIn=false,pcx=0,pcy=0;
function setHover(b){if(hover&&hover!==b)hover.g.classList.remove('hov');hover=b;if(b&&b.hit)b.g.classList.add('hov');if(!dragging)stage.style.cursor=b&&b.hit?'pointer':'grab';placeTip()}
function refOf(t){const b=bodies.find(x=>x.g===t);return b?b.ref:null}
svg.addEventListener('keydown',e=>{const t=e.target.closest&&e.target.closest('[data-kind]');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();activate(bodies.find(x=>x.g===t))}});
document.addEventListener('keydown',e=>{
 const a=document.activeElement||{},inField=/^(SELECT|TEXTAREA)$/.test(a.tagName)||(a.tagName==='INPUT'&&a.type!=='checkbox'&&a.type!=='radio');if(inField||UI.list.classList.contains('open'))return;
 if(e.key==='Escape')up();else if(e.key==='+'||e.key==='=')zoomIn();else if(e.key==='-'||e.key==='_')up();else if(e.key==='0')goGalaxy()});
/* free camera: drag = orbit, right/shift/ctrl-drag or two-finger = pan, wheel/pinch = dolly (all damped). Zooming far out / far in still collapses / expands a level. */
const onUI=t=>!(t===cv||svg.contains(t)),ptrs=new Map();
stage.addEventListener('click',e=>{if(onUI(e.target)||UI.list.classList.contains('open')||performance.now()-sup<150)return;activate(pick(e.clientX,e.clientY))});
stage.addEventListener('pointermove',e=>{if(onUI(e.target)){ptrIn=false;if(hover)setHover(null);return}ptrIn=true;pcx=e.clientX;pcy=e.clientY;const r=stage.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;if(!dragging)setHover(pick(pcx,pcy));else placeTip()});
stage.addEventListener('pointerleave',()=>{ptrIn=false;setHover(null)});let drag=null,pinch=null;
stage.style.touchAction='none';stage.style.cursor='grab';
function panBy(dx,dy){const sc=wppCur*zf,up=tmp.setFromMatrixColumn(camera.matrixWorld,1);panT.addScaledVector(right,-dx*sc).addScaledVector(up,dy*sc)}
stage.addEventListener('contextmenu',e=>{if(!onUI(e.target))e.preventDefault()});
stage.addEventListener('pointerdown',e=>{if(onUI(e.target)||UI.list.classList.contains('open'))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,mode:(e.button===2||e.button===1||e.shiftKey||e.ctrlKey||e.metaKey)?'pan':'rot'};
 if(ptrs.size===2){const q=[...ptrs.values()];pinch={d:Math.hypot(q[0].x-q[1].x,q[0].y-q[1].y),mx:(q[0].x+q[1].x)/2,my:(q[0].y+q[1].y)/2};drag.moved=true;dragging=true}});
stage.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
 if(ptrs.size===2&&pinch){const q=[...ptrs.values()],d=Math.hypot(q[0].x-q[1].x,q[0].y-q[1].y),mx=(q[0].x+q[1].x)/2,my=(q[0].y+q[1].y)/2;
  if(d>0&&pinch.d>0)zfT=clamp(zfT*pinch.d/d,.12,6);panBy(mx-pinch.mx,my-pinch.my);pinch={d,mx,my};holdUntil=performance.now()+1500;return}
 if(!drag||drag.id!==e.pointerId)return;
 if(!drag.moved){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;drag.moved=true;dragging=true;stage.style.cursor='grabbing';try{stage.setPointerCapture(e.pointerId)}catch(_){}}
 if(drag.mode==='pan')panBy(dx,dy);else{yawT-=dx*.0055;pitchT=clamp(pitchT+dy*.0055,-1.5,1.5)}
 holdUntil=performance.now()+1500});
const endp=e=>{ptrs.delete(e.pointerId);if(drag&&drag.moved)sup=performance.now();if(ptrs.size<2)pinch=null;if(!ptrs.size){dragging=false;drag=null;stage.style.cursor='grab'}else if(drag&&drag.id===e.pointerId)drag=null};
stage.addEventListener('pointerup',endp);stage.addEventListener('pointercancel',endp);
stage.addEventListener('wheel',e=>{if(onUI(e.target)||UI.list.classList.contains('open'))return;e.preventDefault();
 zfT=clamp(zfT*Math.exp(e.deltaY*(e.deltaMode===1?16:1)*(e.ctrlKey?.012:.0016)),.12,6);const n=performance.now();holdUntil=n+1200;
 if(n-lastWheel>800){if(zfT>3.4&&level>0){lastWheel=n;up()}else if(zfT<.3){lastWheel=n;zoomIn()}}},{passive:false});
function resetView(){yawT=0;pitchT=EL;zfT=1;panT.set(0,0,0)}
function zoomIn(){const b=hover&&hover.hit?hover:null;if(b){activate(b);return}
 if(level===0){const S=sysList.slice().sort((p,q)=>Math.hypot(p.b.sx-W/2,p.b.sy-H/2)-Math.hypot(q.b.sx-W/2,q.b.sy-H/2))[0];goStar(S)}
 else if(level===1){const P=fSys.planets.slice().sort((p,q)=>q.p.stats.active-p.p.stats.active||q.p.stats.share-p.p.stats.share)[0];goPlanet(P)}
 else if(level===2){const M=fPlanet.moons.slice().sort((p,q)=>q.m.stats.active-p.m.stats.active||q.m.stats.share-p.m.stats.share)[0];M&&goMoon(M)}
 else if(level===3&&selMoonM&&selMoonM.groups.length){goGroup(selMoonM.groups.slice().sort((p,q)=>q.g.stats.active-p.g.stats.active||q.g.stats.share-p.g.stats.share)[0])}
 else if((level===3||level===4)&&!selAst){const L=selGroup?selGroup.g.skills.map(s=>AST[s.id]):selMoonM&&selMoonM.asts;if(L&&L.length){const on=A=>{const k=SG.knowOf(A.s);return k>=SOL.ACTIVE_LO&&k<SOL.ACTIVE_HI?1:0};goAst(L.slice().sort((p,q)=>on(q)-on(p)||p.k-q.k)[0])}}}
UI.zoom.querySelector('#zin').onclick=zoomIn;UI.zoom.querySelector('#zout').onclick=up;UI.zoom.querySelector('#zfit').onclick=goGalaxy;
UI.presets.innerHTML='<button class="btn" data-j="all">Galaxy</button>'+SOL.systems.map(y=>'<button class="btn" data-j="'+y.id+'">'+y.name+'</button>').join('');
UI.presets.onclick=e=>{const j=e.target.dataset&&e.target.dataset.j;if(!j)return;j==='all'?goGalaxy():goStar(SYS[j])};
{const rb=document.createElement('button');rb.className='btn';rb.id='rview';rb.textContent='⟲ Reset view';rb.title='Back to the default angle and zoom';rb.onclick=resetView;UI.top.querySelector('#listbtn').before(rb)}
const lbtn=UI.top.querySelector('#listbtn');lbtn.onclick=()=>{const o=UI.list.classList.toggle('open');lbtn.setAttribute('aria-pressed',o);lbtn.textContent=o?'🗺 Map view':'☰ List view';if(o)buildList()};
function buildList(){
 let h='<h2>List view <span class="mut sm">same stars, planets, moons and skills, no map needed</span></h2>';
 SOL.systems.forEach(y=>{h+='<section class="sg-ol"><h3 style="color:'+y.color+'">'+y.name+' <span class="mut sm">star · '+y.n+' domains · '+y.skills.length+' skills · '+pct(y.stats.share)+'% solid</span></h3>';
  y.planets.forEach(p=>{h+='<details'+(p.stats.on&&y.id==='math'?'':'')+'><summary><b>'+p.name+'</b> <span class="mut sm">planet '+(p.i+1)+' · '+p.moons.length+' '+(y.hasAsts?'topics':'skills')+' · '+pct(p.stats.share)+'% solid'+(p.stats.on?' · in progress':'')+'</span></summary>';
   p.moons.forEach(m=>{if(m.skill){h+='<ul><li>'+row(m.skill)+'</li></ul>';return}h+='<details style="margin-left:14px"><summary>'+m.name+' <span class="mut sm">topic · '+m.skills.length+' skills'+(m.groups?' in '+m.groups.length+' groups':'')+' · '+pct(m.stats.share)+'% solid</span></summary>'+(m.groups?m.groups.map(g=>'<details style="margin-left:14px"><summary>'+g.name+' <span class="mut sm">group · '+g.n+' skills · '+pct(g.stats.share)+'% solid</span></summary><ul>'+g.skills.map(s=>'<li>'+row(s)+'</li>').join('')+'</ul></details>').join(''):'<ul>'+m.skills.map(s=>'<li>'+row(s)+'</li>').join('')+'</ul>')+'</details>'});h+='</details>'});
  h+='</section>'});
 UI.list.innerHTML=h;UI.list.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{UI.list.classList.remove('open');lbtn.setAttribute('aria-pressed',false);lbtn.textContent='☰ List view';selectSkill(b.dataset.go)})}
function row(s){return '<button class="sg-row" data-go="'+s.id+'"><span class="sg-dot" style="background:'+SG.colorFor(s,'tier')+'"></span><span class="sg-rn"><b>'+s.name+'</b><span class="mut sm">'+SG.statusText(s)+'</span></span></button>'}
UI.list.addEventListener('click',()=>{});
// labels toggle (persisted) + hover tooltip used when labels are off
let LAB=true;try{LAB=localStorage.getItem('sg-solar-labels')!=='off'}catch(e){}
{const w=document.createElement('label');w.className='tg';w.innerHTML='<input type="checkbox" id="lbl"> Labels';const c=w.firstElementChild;c.checked=LAB;c.onchange=()=>{LAB=c.checked;try{localStorage.setItem('sg-solar-labels',LAB?'on':'off')}catch(e){}placeTip()};UI.top.querySelector('#listbtn').before(w)}
[['orb','Orbits','sg-solar-orbits',()=>ORB,v=>{ORB=v}],['prg','Progress rings','sg-solar-progress',()=>PRG,v=>{PRG=v}],['lns','Lines','sg-solar-lines',()=>LNS,v=>{LNS=v}]].forEach(([id,txt,key,get,set])=>{const w=document.createElement('label');w.className='tg';w.innerHTML='<input type="checkbox" id="'+id+'"> '+txt;const c=w.firstElementChild;c.checked=get();c.onchange=()=>{set(c.checked);try{localStorage.setItem(key,c.checked?'on':'off')}catch(e){}};UI.top.querySelector('#listbtn').before(w)});
const tip=document.createElement('div');tip.className='sgs-tip';tip.hidden=true;stage.appendChild(tip);let mx=0,my=0,tipKey='';
function tipHtml(b){const sk=b.kind==='ast'?b.ref:(b.kind==='moon'&&b.M.m.skill)||null;const nm=b.kind==='planet'?b.ref.name:b.t1.textContent;
 return '<b>'+nm+'</b> <span>'+(sk?SG.statusText(sk):pct(b.stats.share)+'% solid')+'</span> <span title="Placeholder estimate: see legend">· ~'+fmtH(b.hrs)+' est.</span>'}
function placeTip(){const lblShown=hover&&LAB&&hover.t1.style.display!=='none'&&hover.lalpha>.05;if(dragging||!hover||!hover.hit||!hover.vis||lblShown){if(!tip.hidden)tip.hidden=true;return}
 const h=tipHtml(hover);if(h!==tipKey){tip.innerHTML=h;tipKey=h}tip.hidden=false;
 const x=clamp(mx+14,4,Math.max(4,W-tip.offsetWidth-4)),y=clamp(my+18,4,Math.max(4,H-tip.offsetHeight-4));tip.style.transform='translate('+x.toFixed(0)+'px,'+y.toFixed(0)+'px)'}

// legend
UI.leg.innerHTML='<b>How to read the map</b><div class="sgs-lg"><div><span class="sgs-planets"><span style="background:radial-gradient(circle at 65% 40%,#5b524b,#17130f 70%)"></span><span style="background:radial-gradient(circle at 65% 40%,#8aa66a,#2f5a3a 45%,#143c58 80%)"></span><span style="background:radial-gradient(circle at 65% 40%,#e8f0ff,#3f9d5a 35%,#1b64a8 70%)"></span></span><span><b>Planet look</b><br><span class="mut">barren and dark → green, blue, clouds</span></span></div>'+
 '<div><svg width="46" height="30" viewBox="-23 -15 46 30"><circle r="9" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="3"/><circle r="9" fill="none" stroke="#58a6ff" stroke-width="3.2" pathLength="100" stroke-dasharray="70 100" transform="rotate(-90)" stroke-linecap="round"/><circle r="13" fill="none" stroke="'+DIMS[0].c+'" stroke-width="2.4" pathLength="360" stroke-dasharray="60 360" transform="rotate(-78)" stroke-linecap="round"/><circle r="13" fill="none" stroke="'+DIMS[2].c+'" stroke-width="2.4" pathLength="360" stroke-dasharray="50 360" transform="rotate(162)" stroke-linecap="round"/></svg><span><b>Completion rings</b><br><span class="mut">inner: share Solid · outer: Explain, Fast, Anywhere</span></span></div>'+
 '<div><svg width="46" height="14"><line x1="2" y1="7" x2="44" y2="7" stroke="#58a6ff" stroke-opacity=".5" stroke-width="1.6"/><circle cx="30" cy="7" r="2.6" fill="#fff"/></svg><span><b>Feeding line</b><br><span class="mut">learning flows to its parent</span></span></div>'+
 '<div><span class="mut">Star = subject · planet = domain · moon = topic · moonlet = course-band group or skill (moonlets orbit moons, smaller moonlets orbit moonlets). Inner orbit = more fundamental. Size = estimated hours to master (placeholder estimate; sqrt scale per level), so a body with more or harder stuff inside is bigger.</span></div></div>';
UI.leg.insertAdjacentHTML('beforeend','<details class="sgs-src"><summary>How size (hours) is estimated</summary><div class="sub">'+SOL.hoursNote+' Sources (retrieved 2026-10-29): <a href="https://www.carnegiefoundation.org/what-is-the-carnegie-unit/" target="_blank" rel="noopener">Carnegie Unit (120 h)</a>, <a href="https://nces.ed.gov/StatProg/handbook/hsts.asp" target="_blank" rel="noopener">NCES</a>, <a href="https://statutes.capitol.texas.gov/GetStatute.aspx?Code=ED&amp;Value=25.081" target="_blank" rel="noopener">Texas Ed. Code 25.081</a>, <a href="https://www.ecfr.gov/current/title-34/subtitle-B/chapter-VI/part-600/subpart-A/section-600.2" target="_blank" rel="noopener">34 CFR 600.2</a>, <a href="https://www.state.gov/national-foreign-affairs-training-center/foreign-language-training" target="_blank" rel="noopener">State Dept FSI</a>.</div></details>');
{const lb=document.createElement('button');lb.className='btn ghost sm';lb.style.cssText='position:absolute;right:6px;top:6px;padding:0 6px';lb.textContent=UI.leg.classList.contains('min')?'Legend':'–';UI.leg.appendChild(lb);lb.onclick=()=>{UI.leg.classList.toggle('min');lb.textContent=UI.leg.classList.contains('min')?'Legend':'–'}}
if(SG.orbit){SG.orbit.mountControl(UI.top.querySelector('#rm').closest('label'));SG.orbit.blockers.push(()=>!!selSkill||drawerOpen()||UI.list.classList.contains('open')||dragging||performance.now()<holdUntil)}

/* ---------- loop + test hooks ---------- */
let last=performance.now(),running=true;
let fc=0,paused=false;function frame(now){requestAnimationFrame(frame);const dt=Math.min(.1,(now-last)/1000);last=now;if(!paused)step(dt,now);renderer.render(scene,camera);if(ptrIn&&!dragging&&(fc++&3)===0){const b=pick(pcx,pcy);if(b!==hover)setHover(b)}placeTip()}
const q=new URLSearchParams(location.search);
window.__sol={set NOSH(v){NOSH=!!v},set Pm(v){Pm=v},get Pm(){return Pm},get SHL(){return SHL},get LAB(){return LAB},get cam(){return{yaw,pitch,zf,yawT,pitchT,zfT,pan:pan.toArray(),pos:camera.position.toArray()}},resetView,set view(v){if(v.yaw!=null)yawT=v.yaw;if(v.pitch!=null)pitchT=v.pitch;if(v.zf!=null)zfT=v.zf},scene,camera,SOL,SYS,PL,MO,bodies,feeds,counts,AST,GRP,goGalaxy,goStar,goPlanet,goMoon,goGroup,goAst,selectSkill,selectMoon,up,get state(){return{level,lv,fSys:fSys&&fSys.id,fPlanet:fPlanet&&fPlanet.p.id,selSkill,selMoon:selMoonM&&selMoonM.m.id,selAst:selAst&&selAst.s.id,selGroup:selGroup&&selGroup.g.id,wpp:wppCur}},settle(){for(let i=0;i<40;i++)step(.1,performance.now()+i*100);},set hover(b){hover=b},set LABV(v){LAB=!!v},get ORB(){return ORB},get LNS(){return LNS},get PRG(){return PRG},ORBITS,stepN(n,dt){for(let i=0;i<n;i++)step(dt,performance.now())},get flare(){return flareG},set paused(v){paused=!!v},snap(o){if(o.yaw!=null)yaw=yawT=o.yaw;if(o.pitch!=null)pitch=pitchT=o.pitch;if(o.zf!=null)zf=zfT=o.zf;if(o.pan){pan.fromArray(o.pan);panT.fromArray(o.pan)}step(.0001,performance.now())},pick,occlusion,get ptrIn(){return ptrIn}};
crumb();step(.016,performance.now());
if(q.get('sys'))goStar(SYS[q.get('sys')]);
if(q.get('planet')&&PL[q.get('planet')])goPlanet(PL[q.get('planet')]);
if(q.get('moon')&&MO[q.get('moon')])goMoon(MO[q.get('moon')]);
if(q.get('group')&&GRP[q.get('group')])goGroup(GRP[q.get('group')]);
if(q.get('skill'))selectSkill(q.get('skill'));
if(q.get('um')!=null){const v=+q.get('um');PL[q.get('planet')||'math:num'].mesh.material.uniforms.uM.value=v}/* test hook: override one planet's mastery look */
if(q.get('sunyaw')){const P=fPlanet||sysList[0].planets[0];yaw=yawT=Math.atan2(P.S.pos.x-P.pos.x,P.S.pos.z-P.pos.z)+(q.get('sunyaw')==='1'?Math.PI/2:+q.get('sunyaw'))}/* test hook: view with the star to the side */
if(q.get('snap')){for(let i=0;i<60;i++)step(.1,performance.now())}
if(q.get('pm')!=null){Pm=+q.get('pm');step(.0001,performance.now())}/* test hook: force a moon phase */
if(q.get('lines')==='0'){LNS=false;const c=document.querySelector('#lns');if(c)c.checked=false}/* test hook: start with Lines off (not saved) */
if(q.get('freeze')){paused=true}
requestAnimationFrame(frame);
