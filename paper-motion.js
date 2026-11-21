(() => {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const C = { ink:"#263b2e", cream:"#fff0c8", tan:"#d5ad76", dark:"#8d6550", blue:"#597e97", pale:"#b2ccd0", forest:"#3f654e", leaf:"#84916a", rose:"#a84961", pink:"#eaa3a5", gold:"#eac16e", white:"#fff7d9" };
  const active = new WeakMap();
  function el(p, type, attrs = {}, words) {
    const n = document.createElementNS(NS,type);
    for (const [k,v] of Object.entries(attrs)) n.setAttribute(k,String(v));
    if (words !== undefined) n.textContent = words;
    p.appendChild(n); return n;
  }
  function wrap(n) { const q=el(n,"g"); for(const child of [...n.children]) if(child!==q) q.appendChild(child); return q; }
  const group=(p,x=0,y=0)=>el(p,"g",{transform:`translate(${x} ${y})`});
  const path=(p,d,fill,extra={})=>el(p,"path",{d,fill,...extra});
  const ellipse=(p,cx,cy,rx,ry,fill,extra={})=>el(p,"ellipse",{cx,cy,rx,ry,fill,...extra});
  const rect=(p,x,y,width,height,rx,fill,extra={})=>el(p,"rect",{x,y,width,height,rx,fill,...extra});
  const line=(p,d,col=C.ink,width=1.7,extra={})=>path(p,d,"none",{stroke:col,"stroke-width":width,"stroke-linecap":"round","stroke-linejoin":"round",...extra});
  const T=(x=0,y=0,a=0,s=1,sy=s)=>({transform:`translate(${x}px,${y}px) rotate(${a}deg) scale(${s},${sy})`});
  const F=(x,y,a,s,o=1,offset)=>({...T(x,y,a,s),opacity:o,...(offset===undefined?{}:{offset})});
  function anim(n,frames,ms=780,delay=0,easing="linear",origin="0px 0px") {
    n.style.transformOrigin=origin;
    if (!n.animate) return;
    n.animate(frames,{duration:ms,delay,easing,fill:"both"});
  }
  function dupe(p,d,col,edge=C.dark) { path(group(p,1,4),d,edge,{opacity:.55});return path(p,d,col,{stroke:edge,"stroke-width":.8,"stroke-linejoin":"round"}); }
  function leaf(p,x,y,col=C.leaf) {
    const a=group(p,x,y);
    dupe(a,"M-11 4Q-7-13 12-13Q15 0 3 8Q-5 12-11 4Z",col);
    line(a,"M-12 9Q-2 1 9-9",C.cream,.8);
    return a;
  }
  function sparkle(p,x,y,col=C.gold,size=1) {
    const h=group(p,x,y);
    path(h,`M0 ${-10*size}Q${2*size} ${-2*size} ${8*size} 0Q${2*size} ${2*size} 0 ${10*size}Q${-2*size} ${2*size} ${-8*size} 0Q${-2*size} ${-2*size} 0 ${-10*size}Z`,col);
    return h;
  }
  function ticket(p,x,y,scale=1) {
    const a=group(p,x,y), b=el(a,"g",{transform:`scale(${scale})`});
    dupe(b,"M-38-23L37-23L38-10Q24-8 38-2L37 23L-38 23L-38 10Q-25 7-38 3Z",C.gold);
    line(b,"M14-19V20",C.dark,1,{"stroke-dasharray":"2 3",opacity:.7});
    el(b,"text",{x:-10,y:9,fill:C.ink,"font-family":"serif","font-weight":"900","font-size":"24","text-anchor":"middle"},"22");
    line(b,"M20 10h11m-11-5h11m-11-5h7",C.dark,1.2,{opacity:.7});
    return a;
  }
  function guard(svg,retry) {
    const a=el(group(svg,180,290),"g");
    dupe(a,"M-88 12L-12-42Q12-53 42-22L78 24Q86 36 68 42L11 52Q-8 51-25 42L-82 60Z",C.tan);
    line(a,"M-40 40Q-6 19 19 26M28 24l27 14",C.dark,1.4);
    const straps=group(a,-14,3);
    dupe(straps,"M-54-25L19-44L51 11L50 29L-14 52L-48 27Z",C.blue);
    line(straps,"M-44-14L16-31M-29 18L34 1M-12 35L44 16",C.pale,2,{"stroke-dasharray":"2 3"});
    const flap=el(straps,"g");
    dupe(flap,"M-38-14L-16-36L23-42Q35-38 31-27L14 32L-15 45L-31 24Z",C.pale,C.blue);
    line(flap,"M-22 22L5-28M-15 25L9-7",C.blue,2.3);
    const marker=el(group(svg,243,244),"g");
    line(marker,"M-22 1Q-7-24 17-6M7-7l12 1l-5-10",C.white,3);
    anim(a,[F(0,35,-16,.65,0,0),F(0,0,-6,1,1,.2),F(0,0,0,1,1,.75),F(0,14,5,.92,0,1)],790);
    anim(flap,[T(0,1,-24,.94,.62),T(5,-13,-61,1,.20),T(0,2,retry?-29:7,1,1),T(0,0,retry?-25:0)],650,30,"cubic-bezier(.29,.58,.24,.99)");
    anim(marker,[F(0,2,0,.75,0),F(0,0,-9,1),F(6,2,-16,1),F(15,-6,-22,.9,0)],660,35);
  }
  function flutter(svg, finale=false) {
    const a=el(group(svg,180,278),"g");
    [ ["M-132 39Q-76 80-25 25Q15-13 61-5",C.cream],["M-110 1Q-68 25-31-6M46 18q47 10 79-16",C.tan] ].forEach(([d,c],i)=>{
      const q=line(a,d,c,i?2:3,{"stroke-dasharray":i?"6 9":"12 8"});
      anim(q,[{strokeDashoffset:57,opacity:0},{strokeDashoffset:21,opacity:1},{strokeDashoffset:-35,opacity:0}],820);
    });
    const n=wrap(ticket(a,0,0));
    anim(n,[F(-140,75,-71,.63,0,0),F(-93,27,-18,.93,1,.19),F(-42,-36,38,1,1,.36),{...T(18,-38,79,.83,.35),opacity:1,offset:.55},F(69,13,18,.94,1,.69),F(finale?52:156,finale?31:-49,25,.67,0,1)],850);
  }
  function bridge(svg) {
    const a=el(group(svg,182,332),"g");
    const water=[-37,-11,14];
    water.forEach((y,i)=>{
      const w=el(group(a,0,y),"g");
      dupe(w,"M-147 8Q-97-19-48 0T50-2T146-5L148 11Q89 20 49 12T-50 13T-145 19Z",i===1?C.pale:C.blue,C.blue);
      line(w,"M-137 10Q-82-6-48 4T48 0T139-2",C.white,1.2,{opacity:.85});
      anim(w,[F(-45,3,0,.94,0),F(-12,0,0,1,1),F(22,4,0,1,.72),F(64,6,0,1,0)],780,i*34);
    });
    for(let i=0;i<4;i++){
      const f=wrap(leaf(a,-77+i*49,-45+i%2*22,i%2?C.gold:C.leaf));
      anim(f,[F(-34,-13,-31,.75,0),F(-12,-8,6,1),F(35,8,35,.9),F(80,6,74,.75,0)],810,i*24);
    }
  }
  function treat(svg,choice) {
    const value=String(typeof choice==="string"?choice:choice?.label??choice?.text??choice??"").toLowerCase();
    const melon=/дын|^1$/.test(value), a=el(group(svg,180,300),"g");
    dupe(a,"M-30-9L30-9L0 65Z",C.tan,C.dark);
    line(a,"M-22 4L11 41M-16 18L19 18M-8 34L11 34M23 1L-10 39",C.gold,2,{opacity:.65});
    dupe(a,"M-36-9L-33-22Q-38-54 0-57Q36-53 33-24L36-9Q25 2 14-6Q4 1-5-6Q-19 3-36-9Z",melon?C.leaf:C.pink,melon?C.forest:C.rose);
    line(a,"M-23-35Q-18-46-4-47",C.cream,3,{opacity:.85});
    anim(a,[F(0,58,-17,.65,0,0),F(0,-10,9,1.03,1,.28),F(0,1,-3,1,1,.59),F(0,0,0,1,1,.76),F(0,13,2,.95,0,1)],800);
    for(let i=0;i<6;i++){
      const x=120+(i*37)%120, n=ellipse(group(svg,x,272+(i%3)*12),0,0,3+(i%3),3+(i%3),C.white,{stroke:C.tan,"stroke-width":1});
      anim(n,[F(0,16,0,.5,0),F(-5,-15,0,1),F(7,-49,0,1.14),F(10,-83,0,1.45,0)],570,i*22);
    }
  }
  function rabbit(svg) {
    const floor=el(group(svg,182,347),"g");
    ellipse(floor,0,0,87,13,C.dark,{opacity:.35});
    anim(floor,[F(-38,8,0,.55,0),F(-26,0,0,.68),F(40,0,0,.78),F(103,6,0,.58,0)],780);
    const a=el(group(svg,180,321),"g");
    dupe(a,"M-44 37Q-60 28-52 14Q-44-4-19-7Q-7-7 0-3Q1-22 13-27L6-54Q6-66 15-63L24-52L30-31L35-30L41-55Q49-66 54-59L52-27Q68-21 74-8Q78 3 64 11L48 16Q42 33 22 40L-44 37Z",C.cream,C.dark);
    ellipse(a,-52,11,14,15,C.tan);
    ellipse(a,59,-11,2.7,3.1,C.ink);
    line(a,"M64 1l8-2m-7 5l8 1",C.dark,1);
    const back=el(group(a,-25,26),"g"), front=el(group(a,37,23),"g");
    dupe(back,"M-14-10Q8-13 27 4Q32 8 27 12L-24 12Q-36 8-29 2Z",C.tan);
    dupe(front,"M-14-7Q1-16 18 2L21 8Q16 12-14 11Z",C.tan);
    anim(back,[T(0,0,-8),T(-14,-8,50,1),T(4,-4,-45,1),T(0,0,12)],700);
    anim(front,[T(0,0),T(10,-15,-41),T(0,-6,38),T(7,0,-13)],700);
    anim(a,[F(-128,9,-4,.65,0,0),{...T(-95,3,-6,.79,.67),opacity:1,offset:.15}, F(-55,-74,-12,1,1,.39),F(13,-51,16,.93,1,.59),{...T(55,4,2,.78,.65),opacity:1,offset:.72},F(144,-40,-13,.72,0,1)],840);
  }
  function swing(svg) {
    const p=group(svg,180,165), a=el(p,"g");
    line(p,"M-39-12Q0-29 43-14",C.forest,7);
    line(a,"M-22-11L-37 163M24-13L39 163",C.cream,3.8);
    line(a,"M-22-11L-37 163M24-13L39 163",C.dark,1.2,{"stroke-dasharray":"4 3"});
    dupe(a,"M-55 154L54 154L59 168L-58 168Z",C.tan);
    line(a,"M-42 159H48",C.dark,1.1);
    anim(a,[F(0,0,-36,.89,0,0),F(0,0,-29,1,1,.16),F(0,0,30,1,1,.43),F(0,0,-17,1,1,.67),F(0,0,8,1,1,.84),F(0,0,2,1,0,1)],900,0,"ease-in-out");
    [1,2,3].forEach(i=>{
      const q=line(p,`M ${-110+i*13} ${153+i*9} Q 0 ${210+i*9} ${110-i*13} ${153+i*9}`,C.cream,1.3,{"stroke-dasharray":"7 11"});
      anim(q,[{opacity:0,strokeDashoffset:50},{opacity:.8,strokeDashoffset:22},{opacity:0,strokeDashoffset:-22}],760,i*24);
    });
  }
  function waves(svg) {
    const p=group(svg,180,310);
    for(let i=0;i<4;i++){
      const a=el(group(p,0,i*16),"g");
      const d="M-159 35Q-103-13-56 19T39 19T160 9L160 37Q95 24 44 53T-57 51T-160 63Z";
      dupe(a,d,[C.dark,C.blue,C.pale,C.blue][i],i?C.blue:C.dark);
      line(a,"M-155 35Q-101-12-54 19T40 18T156 10",C.white,1.6,{opacity:.7});
      anim(a,[F(-51,18,-6,.9,0),F(-13,-3,0,1,1),F(41,0,5,1,.9),F(90,14,9,.97,0)],720,i*36);
    }
    const item=wrap(ticket(p,14,-22,.74));
    anim(item,[F(4,-28,-21,.89,0,0),F(0,-18,-9,1,1,.22),F(-4,-8,3,1,1,.43),F(4,29,-4,.73,.89,.68),F(12,58,-7,.42,0,1)],780);
  }
  function fireflies(svg) {
    const a=group(svg,180,278);
    const coords=[[-126,63],[-88,19],[-49,34],[-10,-24],[29,-47],[62,-31],[108,-77],[130,-101]];
    coords.forEach(([x,y],i)=>{
      const p=group(a,x,y), s=wrap(sparkle(p,0,0,i%2?C.white:C.gold,.47+i*.044));
      anim(s,[F(0,0,0,.1,0),F(0,0,22,1.3,.94),F(0,-5,40,.68,.84),F(0,-8,65,.1,0)],440,i*61);
    });
    const m=el(a,"g");
    ellipse(m,0,0,17,17,C.gold,{opacity:.23});
    ellipse(m,0,0,10,10,C.gold,{opacity:.44});
    ellipse(m,0,0,5.5,5.5,C.white);
    path(m,"M-3 0Q-21-17-14-21Q-7-25-1-7M4 0Q18-11 19-17Q16-23 7-16Z",C.cream,{opacity:.8});
    anim(m,coords.map(([x,y],i)=>F(x,y,i%2?10:-12,i===0?.48:i===coords.length-1?.72:1,i===0||i===coords.length-1?0:1)),880);
  }
  function envelope(svg) {
    const a=el(group(svg,180,325),"g");
    const lid=el(group(a,0,-2),"g");
    dupe(lid,"M-88 0L0 73L88 0Z",C.tan,C.dark);
    line(lid,"M-82 4l81 60L80 4",C.cream,1.3,{"stroke-dasharray":"2 3"});
    const rear=rect(a,-88,-2,176,99,4,C.dark);
    a.insertBefore(rear,a.firstChild);
    const slip=el(group(a,0,22),"g");
    rect(slip,-72,-12,145,83,3,C.white,{stroke:C.tan,"stroke-width":1});
    line(slip,"M-54 14h90m-90 10h101m-101 9h73",C.tan,1.3);
    el(slip,"text",{x:-53,y:3,fill:C.ink,"font-family":"serif","font-size":"13","font-style":"italic"},"Тане");
    dupe(a,"M-88-2L-2 53L88-2L88 92L-88 92Z",C.cream);
    line(a,"M-85 90L-4 43L84 90",C.dark,1.25,{opacity:.55});
    const front=el(group(a,0,-2),"g");
    const topShape=lid.cloneNode(true);front.appendChild(topShape);
    ellipse(front,0,57,10,10,C.rose,{stroke:C.dark,"stroke-width":1});
    anim(a,[F(0,26,7,.77,0,0),F(0,-6,-3,1,1,.2),F(0,0,0,1,1,.87),F(0,5,0,.96,0,1)],915);
    anim(front,[{...T(),opacity:1,offset:0},{...T(),opacity:1,offset:.27},{...T(0,0,0,1,.03),opacity:1,offset:.49},{...T(0,0,0,1,.03),opacity:0,offset:.50},{...T(0,0,0,1,.03),opacity:0,offset:1}],850);
    anim(lid,[{...T(0,0,0,1,.03),opacity:0,offset:0},{...T(0,0,0,1,.03),opacity:0,offset:.48},{...T(0,0,0,1,-.03),opacity:1,offset:.50},{...T(0,0,0,1,-1),opacity:1,offset:.78},{...T(0,0,0,1,-.88),opacity:1,offset:1}],850);
    anim(slip,[T(0,20,0,1),T(0,13,0,1),T(0,-61,-8,1),T(0,-98,-5,1)],900);
  }
  const scenes={"01":guard,"02":flutter,"03":bridge,"04":treat,"05":rabbit,"06":swing,"07":waves,"08":fireflies,"09":envelope,"10":(svg)=>flutter(svg,true)};
  function play(root,{from,to,choice}={}) {
    if (!root?.appendChild) return;
    const prior=active.get(root);
    if(prior){clearTimeout(prior.timer);prior.svg.remove();active.delete(root);}
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const key=String(from??to??"").padStart(2,"0"), draw=scenes[key];
    if (!draw) return;
    const svg=document.createElementNS(NS,"svg");
    svg.setAttribute("viewBox","0 100 360 420");
    svg.setAttribute("preserveAspectRatio","xMidYMid slice");
    svg.setAttribute("aria-hidden","true");svg.setAttribute("focusable","false");
    Object.assign(svg.style,{position:"absolute",inset:"0",width:"100%",height:"100%",pointerEvents:"none",overflow:"hidden"});
    root.appendChild(svg);
    if(key==="01")draw(svg,String(to)==="01");
    else if(key==="04")draw(svg,choice);
    else if(key==="02")draw(svg);
    else draw(svg);
    const timer=setTimeout(()=>{svg.remove();if(active.get(root)?.svg===svg)active.delete(root);},940);
    active.set(root,{svg,timer});
  }
  window.PaperMotion={play};
})();
